/**
 * CatalogStarLayer — renders real stars from the HYG catalog as GL_POINTS.
 *
 * Uses pre-processed binary star data (public/data/stars.bin) containing
 * positions derived from RA/Dec, apparent magnitudes, and B-V color indices.
 * Stars are colored using the Ballesteros B-V → temperature → RGB mapping
 * and sized based on apparent magnitude.
 */

import type { CatalogStar } from '@/data/loadCatalog';
import { buildCatalogVertexData, loadCatalog } from '@/data/loadCatalog';
import { bvToRgbFast } from '@/data/starColor';
import type { RenderLayer, RenderParams } from '@/layers/RenderLayer';
import type { Renderer } from '@/renderer/Renderer';
import { mat4 } from 'gl-matrix';

import catalogStarsFragSrc from '@/shaders/catalog-stars.frag.glsl?raw';
import catalogStarsVertSrc from '@/shaders/catalog-stars.vert.glsl?raw';

export interface CatalogStarParams {
  enabled: boolean;
  /** Maximum apparent magnitude to display (higher = more/fainter stars) */
  magnitudeLimit: number;
  /** Overall brightness multiplier */
  brightness: number;
  /** Point size multiplier */
  sizeScale: number;
  /** Blend mode: 'overlay' renders on top, 'replace' hides procedural stars */
  blendMode: 'overlay' | 'replace';
}

const DEFAULT_PARAMS: CatalogStarParams = {
  enabled: true,
  magnitudeLimit: 6.5,
  brightness: 1.0,
  sizeScale: 1.0,
  blendMode: 'overlay',
};

export class CatalogStarLayer implements RenderLayer {
  readonly id = 'catalog-stars';
  readonly name = 'Catalog Stars';
  enabled = true;
  order = 15; // After procedural point stars (10), before nebula (20)

  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private vbo: WebGLBuffer | null = null;
  private uViewProjLoc: WebGLUniformLocation | null = null;
  private uFaceSizeLoc: WebGLUniformLocation | null = null;
  private uBrightnessLoc: WebGLUniformLocation | null = null;

  private params: CatalogStarParams = { ...DEFAULT_PARAMS };
  private gl: WebGL2RenderingContext | null = null;

  /** Full catalog data (loaded once) */
  private catalog: CatalogStar[] | null = null;
  /** Whether catalog is currently being loaded */
  private loading = false;
  /** Error message if loading failed */
  private loadError: string | null = null;
  /** Current vertex count uploaded to GPU */
  private vertexCount = 0;
  /** Tracks the last params used to build vertex data */
  private lastMagLimit = -1;
  private lastSizeScale = -1;
  private needsRebuild = true;

  init(renderer: Renderer): void {
    this.gl = renderer.gl;
    this.program = renderer.createProgram(catalogStarsVertSrc, catalogStarsFragSrc);
    const { gl } = renderer;

    this.uViewProjLoc = gl.getUniformLocation(this.program, 'uViewProj');
    this.uFaceSizeLoc = gl.getUniformLocation(this.program, 'uFaceSize');
    this.uBrightnessLoc = gl.getUniformLocation(this.program, 'uBrightness');

    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();

    // Start loading catalog data
    this.loadCatalogData();
  }

  /** Async load of the binary star catalog */
  private async loadCatalogData(): Promise<void> {
    if (this.loading || this.catalog) return;
    this.loading = true;

    try {
      this.catalog = await loadCatalog();
      this.needsRebuild = true;
      console.log(`[CatalogStarLayer] Loaded ${this.catalog.length} stars`);
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : String(err);
      console.error(`[CatalogStarLayer] Failed to load catalog:`, err);
    } finally {
      this.loading = false;
    }
  }

  /** Rebuild GPU vertex data when params change */
  private rebuildVertexData(): void {
    const gl = this.gl;
    if (!gl || !this.vao || !this.vbo || !this.catalog) return;

    const { magnitudeLimit, sizeScale } = this.params;
    const { data, count } = buildCatalogVertexData(
      this.catalog,
      magnitudeLimit,
      sizeScale,
      bvToRgbFast,
    );

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    const stride = 7 * 4; // 7 floats × 4 bytes
    // aPosition (location 0): vec3
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
    // aSize (location 1): float
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, stride, 3 * 4);
    // aColor (location 2): vec3
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, 4 * 4);

    gl.bindVertexArray(null);

    this.vertexCount = count;
    this.lastMagLimit = magnitudeLimit;
    this.lastSizeScale = sizeScale;
    this.needsRebuild = false;
  }

  render(renderer: Renderer, params: RenderParams): void {
    const { gl } = renderer;
    if (!this.program || !this.vao) return;
    if (!this.catalog || this.catalog.length === 0) return;

    // Check if we need to rebuild vertex data
    if (
      this.needsRebuild ||
      this.params.magnitudeLimit !== this.lastMagLimit ||
      this.params.sizeScale !== this.lastSizeScale
    ) {
      this.rebuildVertexData();
    }

    if (this.vertexCount === 0) return;

    gl.useProgram(this.program);

    // Compute view-projection matrix
    const viewProj = mat4.create();
    mat4.multiply(viewProj, params.projectionMatrix as mat4, params.viewMatrix as mat4);
    gl.uniformMatrix4fv(this.uViewProjLoc, false, viewProj as Float32Array);
    gl.uniform1f(this.uFaceSizeLoc, params.faceSize);
    gl.uniform1f(this.uBrightnessLoc, this.params.brightness);

    // Enable additive blending for stars
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.POINTS, 0, this.vertexCount);
    gl.bindVertexArray(null);

    // Restore normal blending
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  updateParams(params: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(params)) {
      if (key in this.params) {
        const k = key as keyof CatalogStarParams;
        if (this.params[k] !== value) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this.params as any)[k] = value;

          // Mark for rebuild if magnitude or size params changed
          if (k === 'magnitudeLimit' || k === 'sizeScale') {
            this.needsRebuild = true;
          }
        }
      }
    }
  }

  getParams(): Record<string, unknown> {
    return {
      ...this.params,
      starCount: this.vertexCount,
      totalStars: this.catalog?.length ?? 0,
      loading: this.loading,
      error: this.loadError,
    };
  }

  /** Get loading status for UI feedback */
  isLoading(): boolean {
    return this.loading;
  }

  /** Get the total number of catalog stars loaded */
  getTotalStars(): number {
    return this.catalog?.length ?? 0;
  }

  /** Get the current displayed star count */
  getDisplayedStars(): number {
    return this.vertexCount;
  }

  dispose(): void {
    const gl = this.gl;
    if (gl) {
      if (this.vbo) gl.deleteBuffer(this.vbo);
      if (this.vao) gl.deleteVertexArray(this.vao);
      if (this.program) gl.deleteProgram(this.program);
    }
    this.program = null;
    this.vao = null;
    this.vbo = null;
    this.catalog = null;
  }
}
