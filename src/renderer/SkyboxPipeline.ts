/**
 * SkyboxPipeline — orchestrates the full cubemap rendering pipeline.
 *
 * Manages layers, renders all 6 cubemap faces, and provides
 * methods for preview rendering and export.
 */

import type { CubemapFaceData } from '@/export';
import { BackgroundLayer } from '@/layers/BackgroundLayer';
import { CatalogStarLayer } from '@/layers/CatalogStarLayer';
import { ConstellationBoundaryLayer } from '@/layers/ConstellationBoundaryLayer';
import { ConstellationLabelLayer } from '@/layers/ConstellationLabelLayer';
import { ConstellationLayer } from '@/layers/ConstellationLayer';
import { MilkyWayLayer } from '@/layers/MilkyWayLayer';
import { NamedStarLabelLayer } from '@/layers/NamedStarLabelLayer';
import { NebulaLayer } from '@/layers/NebulaLayer';
import { PointStarLayer } from '@/layers/PointStarLayer';
import type { RenderLayer, RenderParams } from '@/layers/RenderLayer';
import { SunLayer } from '@/layers/SunLayer';
import { AsyncReadback } from '@/renderer/AsyncReadback';
import { BloomPass, type BloomParams } from '@/renderer/BloomPass';
import { CubemapFBO } from '@/renderer/CubemapFBO';
import { FullscreenQuad } from '@/renderer/FullscreenQuad';
import { GodRayPass, type GodRayParams } from '@/renderer/GodRayPass';
import { LensFlarePass, type LensFlareParams } from '@/renderer/LensFlarePass';
import { Renderer } from '@/renderer/Renderer';
import { CUBE_FACES } from '@/types';
import { getCubeFaceViewMatrix, getCubemapProjectionMatrix } from '@/utils/cubemap';
import { mat4, vec3, vec4 } from 'gl-matrix';

import fullscreenVertSrc from '@/shaders/fullscreen.vert.glsl?raw';
import skyboxPreviewFragSrc from '@/shaders/skybox-preview.frag.glsl?raw';

export class SkyboxPipeline {
  private renderer: Renderer;
  private cubemapFBO: CubemapFBO;
  private layers: RenderLayer[] = [];
  private projectionMatrix: mat4;

  // Preview rendering
  private previewProgram: WebGLProgram | null = null;
  private previewQuad: FullscreenQuad | null = null;
  private previewUInvViewProj: WebGLUniformLocation | null = null;
  private previewUCubemap: WebGLUniformLocation | null = null;

  // Post-processing
  private bloomPass: BloomPass;
  private bloomParams: BloomParams = {
    enabled: false,
    threshold: 0.8,
    softKnee: 0.5,
    intensity: 1.0,
    iterations: 3,
  };

  private lensFlarePass: LensFlarePass;
  private lensFlareParams: LensFlareParams = {
    enabled: false,
    intensity: 0.3,
    ghostCount: 4,
    ghostSpacing: 0.3,
    haloRadius: 0.4,
    haloIntensity: 0.2,
    chromaticAberration: 0.5,
  };

  private godRayPass: GodRayPass;
  private godRayParams: GodRayParams = {
    enabled: false,
    exposure: 0.3,
    decay: 0.96,
    density: 0.8,
    weight: 0.5,
  };

  /** Sun world-space direction (normalized), updated from store */
  private sunPosition: [number, number, number] = [1, 0.3, 0.5];

  /** PBO-based async pixel readback for histogram (avoids GPU stalls) */
  private asyncReadback: AsyncReadback;

  constructor(canvas: HTMLCanvasElement, faceSize: number) {
    this.renderer = new Renderer({ canvas, faceSize });
    this.cubemapFBO = new CubemapFBO(this.renderer.gl, faceSize);
    this.bloomPass = new BloomPass(this.renderer, faceSize);
    this.lensFlarePass = new LensFlarePass(this.renderer);
    this.godRayPass = new GodRayPass(this.renderer, faceSize);
    this.asyncReadback = new AsyncReadback(this.renderer.gl);
    this.projectionMatrix = getCubemapProjectionMatrix();

    // Create default layers
    this.layers = [
      new BackgroundLayer(),
      new PointStarLayer(),
      new NamedStarLabelLayer(),
      new CatalogStarLayer(),
      new ConstellationBoundaryLayer(),
      new ConstellationLayer(),
      new ConstellationLabelLayer(),
      new MilkyWayLayer(),
      new NebulaLayer(),
      new SunLayer(),
    ];

    // Initialize all layers
    for (const layer of this.layers) {
      layer.init(this.renderer);
    }

    // Setup preview shader
    this._initPreview();
  }

  /** Initialize the preview cubemap sampling shader */
  private _initPreview(): void {
    const { gl } = this.renderer;
    this.previewProgram = this.renderer.createProgram(fullscreenVertSrc, skyboxPreviewFragSrc);
    this.previewQuad = new FullscreenQuad(gl);
    this.previewUInvViewProj = gl.getUniformLocation(this.previewProgram, 'uInvViewProj');
    this.previewUCubemap = gl.getUniformLocation(this.previewProgram, 'uCubemap');
  }

  /** Get a layer by its ID */
  getLayer(id: string): RenderLayer | undefined {
    return this.layers.find((l) => l.id === id);
  }

  /** Get all layers sorted by render order */
  getSortedLayers(): RenderLayer[] {
    return [...this.layers].sort((a, b) => a.order - b.order);
  }

  /** Get the underlying GL context */
  getGL(): WebGL2RenderingContext {
    return this.renderer.gl;
  }

  /** Get the renderer instance (for tiled export) */
  getRenderer(): Renderer {
    return this.renderer;
  }

  /** Update the face size for cubemap rendering */
  setFaceSize(size: number): void {
    this.renderer.faceSize = size;
    this.cubemapFBO.resize(size);
    this.bloomPass.resize(size);
    this.godRayPass.resize(size);
  }

  /** Update bloom post-processing parameters */
  setBloomParams(params: BloomParams): void {
    this.bloomParams = { ...params };
  }

  /** Update lens flare parameters */
  setLensFlareParams(params: LensFlareParams): void {
    this.lensFlareParams = { ...params };
  }

  /** Update god ray parameters */
  setGodRayParams(params: GodRayParams): void {
    this.godRayParams = { ...params };
  }

  /** Update sun position for post-processing projection */
  setSunPosition(position: [number, number, number]): void {
    this.sunPosition = [...position];
  }

  /**
   * Project the sun direction onto a cubemap face's UV space.
   * Returns the UV and whether the sun is within extended face bounds.
   */
  private _projectSunOnFace(viewMatrix: Float32Array): { uv: [number, number]; visible: boolean } {
    const dir = vec3.create();
    vec3.normalize(dir, this.sunPosition as unknown as vec3);

    // Build view-projection for this face
    const viewProj = mat4.create();
    mat4.multiply(viewProj, this.projectionMatrix, viewMatrix as unknown as mat4);

    // Transform sun position (on unit sphere) into clip space
    const sunWorld = vec4.fromValues(dir[0], dir[1], dir[2], 1.0);
    const sunClip = vec4.create();
    vec4.transformMat4(sunClip, sunWorld, viewProj);

    if (sunClip[3] <= 0) {
      return { uv: [0, 0], visible: false };
    }

    const ndcX = sunClip[0] / sunClip[3];
    const ndcY = sunClip[1] / sunClip[3];
    const uvX = ndcX * 0.5 + 0.5;
    const uvY = ndcY * 0.5 + 0.5;

    // Visible if within extended bounds (allow off-screen flare effects)
    const visible = uvX >= -0.5 && uvX <= 1.5 && uvY >= -0.5 && uvY <= 1.5;

    return { uv: [uvX, uvY], visible };
  }

  /**
   * Render all 6 cubemap faces.
   * Each face renders all enabled layers in order.
   */
  renderCubemap(seed: number): void {
    const sortedLayers = this.getSortedLayers();

    for (const face of CUBE_FACES) {
      this.cubemapFBO.bindFace(face);
      this.renderer.clear();

      const viewMatrix = getCubeFaceViewMatrix(face);
      const params: RenderParams = {
        face,
        faceSize: this.renderer.faceSize,
        viewMatrix: viewMatrix as Float32Array,
        projectionMatrix: this.projectionMatrix as Float32Array,
        seed,
      };

      for (const layer of sortedLayers) {
        if (!layer.enabled) continue;
        layer.render(this.renderer, params);
      }

      // Project sun onto this face for post-processing
      const sunProj = this._projectSunOnFace(params.viewMatrix);

      // God rays (before bloom — god rays should bloom too)
      if (this.godRayParams.enabled && sunProj.visible) {
        this.godRayPass.apply(
          this.cubemapFBO.glFramebuffer,
          sunProj.uv,
          sunProj.visible,
          this.renderer.faceSize,
          this.godRayParams,
        );
        // Re-bind the face after god ray pass modifies FBO state
        this.cubemapFBO.bindFace(face);
      }

      // Apply bloom post-processing to this face
      if (this.bloomParams.enabled) {
        this.bloomPass.apply(
          this.cubemapFBO.glFramebuffer,
          this.renderer.faceSize,
          this.bloomParams,
        );
        // Re-bind the face after bloom modifies FBO state
        this.cubemapFBO.bindFace(face);
      }

      // Lens flare (after bloom — analytical overlay)
      if (this.lensFlareParams.enabled && sunProj.visible) {
        this.lensFlarePass.apply(
          sunProj.uv,
          sunProj.visible,
          this.renderer.faceSize,
          this.lensFlareParams,
        );
      }
    }

    this.cubemapFBO.unbind();
  }

  /**
   * Render preview to the canvas.
   * Samples the cubemap using a camera-oriented view direction.
   */
  renderPreview(yaw: number, pitch: number, fov: number): void {
    const { gl } = this.renderer;
    if (!this.previewProgram || !this.previewQuad) return;

    // Set viewport to canvas size
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(this.previewProgram);

    // Build view matrix from yaw/pitch
    const view = mat4.create();
    mat4.rotateX(view, view, -pitch);
    mat4.rotateY(view, view, -yaw);

    // Build projection matrix
    const aspect = gl.drawingBufferWidth / gl.drawingBufferHeight;
    const proj = mat4.create();
    mat4.perspective(proj, (fov * Math.PI) / 180, aspect, 0.01, 100.0);

    // Inverse view-projection for ray direction computation
    const viewProj = mat4.create();
    mat4.multiply(viewProj, proj, view);
    const invViewProj = mat4.create();
    mat4.invert(invViewProj, viewProj);

    gl.uniformMatrix4fv(this.previewUInvViewProj, false, invViewProj as Float32Array);

    // Bind cubemap texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.cubemapFBO.glTexture);
    gl.uniform1i(this.previewUCubemap, 0);

    // Disable blending for preview
    gl.disable(gl.BLEND);

    this.previewQuad.draw();
  }

  /**
   * Read all cubemap face data for export.
   */
  readCubemapData(): CubemapFaceData[] {
    const size = this.cubemapFBO.size;
    return CUBE_FACES.map((face) => ({
      face,
      pixels: this.cubemapFBO.readFace(face),
      width: size,
      height: size,
    }));
  }

  /**
   * Read pixels from a single face for histogram analysis.
   * Defaults to +Z (front) face.
   */
  readFacePixels(face: (typeof CUBE_FACES)[number] = 'pz'): Uint8Array {
    return this.cubemapFBO.readFace(face);
  }

  /**
   * Async pixel readback using PBOs — avoids GPU stalls.
   * Returns the PREVIOUS frame's pixels (1-frame latency) or null if not ready.
   * Call this each frame after renderCubemap() for stall-free histogram data.
   */
  readFacePixelsAsync(face: (typeof CUBE_FACES)[number] = 'pz'): Uint8Array | null {
    const size = this.cubemapFBO.size;
    // Bind the face FBO so readPixels reads from it
    this.cubemapFBO.bindFace(face);
    const result = this.asyncReadback.readAsync(size, size);
    this.cubemapFBO.unbind();
    return result;
  }

  /** Clean up all GPU resources */
  dispose(): void {
    for (const layer of this.layers) {
      layer.dispose();
    }
    this.previewQuad?.dispose();
    this.bloomPass.dispose();
    this.lensFlarePass.dispose();
    this.godRayPass.dispose();
    this.asyncReadback.dispose();
    this.cubemapFBO.dispose();
    this.renderer.dispose();
  }
}
