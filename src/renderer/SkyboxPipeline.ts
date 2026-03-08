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
import { BloomPass, type BloomParams } from '@/renderer/BloomPass';
import { CubemapFBO } from '@/renderer/CubemapFBO';
import { FullscreenQuad } from '@/renderer/FullscreenQuad';
import { Renderer } from '@/renderer/Renderer';
import { CUBE_FACES } from '@/types';
import { getCubeFaceViewMatrix, getCubemapProjectionMatrix } from '@/utils/cubemap';
import { mat4 } from 'gl-matrix';

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

  constructor(canvas: HTMLCanvasElement, faceSize: number) {
    this.renderer = new Renderer({ canvas, faceSize });
    this.cubemapFBO = new CubemapFBO(this.renderer.gl, faceSize);
    this.bloomPass = new BloomPass(this.renderer, faceSize);
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

  /** Update the face size for cubemap rendering */
  setFaceSize(size: number): void {
    this.renderer.faceSize = size;
    this.cubemapFBO.resize(size);
    this.bloomPass.resize(size);
  }

  /** Update bloom post-processing parameters */
  setBloomParams(params: BloomParams): void {
    this.bloomParams = { ...params };
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

      // Apply bloom post-processing to this face
      if (this.bloomParams.enabled) {
        this.bloomPass.apply(
          this.cubemapFBO.glFramebuffer,
          this.renderer.faceSize,
          this.bloomParams,
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

  /** Clean up all GPU resources */
  dispose(): void {
    for (const layer of this.layers) {
      layer.dispose();
    }
    this.previewQuad?.dispose();
    this.bloomPass.dispose();
    this.cubemapFBO.dispose();
    this.renderer.dispose();
  }
}
