/**
 * ConstellationLayer — renders constellation stick figure lines on the sky sphere.
 *
 * Loads the HYG star catalog to resolve Hipparcos IDs to 3D positions,
 * then builds GL_LINES vertex data from constellation stick figure definitions.
 */

import { CONSTELLATIONS } from '@/data/constellationData';
import type { CatalogStar } from '@/data/loadCatalog';
import { loadCatalog } from '@/data/loadCatalog';
import type { RenderLayer, RenderParams } from '@/layers/RenderLayer';
import type { Renderer } from '@/renderer/Renderer';
import { mat4 } from 'gl-matrix';

import constellationFragSrc from '@/shaders/constellation-lines.frag.glsl?raw';
import constellationVertSrc from '@/shaders/constellation-lines.vert.glsl?raw';

import type { HexColor } from '@/types';
import { hexToRgb } from '@/utils/color';

export interface ConstellationParams {
  enabled: boolean;
  /** Line opacity (0-1) */
  opacity: number;
  /** Line color as hex */
  lineColor: HexColor;
  /** Line width in pixels (some GPUs clamp to 1) */
  lineWidth: number;
  /** Set of visible constellation abbreviations (empty = all visible) */
  visibleConstellations: string[];
}

const DEFAULT_PARAMS: ConstellationParams = {
  enabled: true,
  opacity: 0.3,
  lineColor: '#6688cc',
  lineWidth: 1.0,
  visibleConstellations: [],
};

export class ConstellationLayer implements RenderLayer {
  readonly id = 'constellations';
  readonly name = 'Constellations';
  enabled = true;
  order = 16; // After catalog stars (15), before nebula (20)

  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private vbo: WebGLBuffer | null = null;
  private uViewProjLoc: WebGLUniformLocation | null = null;
  private uColorLoc: WebGLUniformLocation | null = null;
  private uOpacityLoc: WebGLUniformLocation | null = null;

  private params: ConstellationParams = { ...DEFAULT_PARAMS };
  private gl: WebGL2RenderingContext | null = null;

  /** Number of line vertices (2 per segment) */
  private vertexCount = 0;
  /** Whether vertex data needs rebuild */
  private needsRebuild = true;
  /** Whether the catalog has been loaded */
  private loading = false;
  private loadError: string | null = null;
  /** HIP ID → 3D position lookup table */
  private hipMap: Map<number, [number, number, number]> | null = null;
  /** Last visible constellations set (for change detection) */
  private lastVisibleKey = '';

  init(renderer: Renderer): void {
    this.gl = renderer.gl;
    this.program = renderer.createProgram(constellationVertSrc, constellationFragSrc);
    const { gl } = renderer;

    this.uViewProjLoc = gl.getUniformLocation(this.program, 'uViewProj');
    this.uColorLoc = gl.getUniformLocation(this.program, 'uColor');
    this.uOpacityLoc = gl.getUniformLocation(this.program, 'uOpacity');

    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();

    // Start async catalog load
    this.loadCatalogAndBuild();
  }

  /** Load the binary star catalog and build the HIP → position lookup */
  private async loadCatalogAndBuild(): Promise<void> {
    if (this.loading || this.hipMap) return;
    this.loading = true;

    try {
      const catalog: CatalogStar[] = await loadCatalog();

      // Build HIP ID → position lookup (only stars with valid HIP IDs)
      this.hipMap = new Map();
      for (const star of catalog) {
        if (star.hip > 0) {
          this.hipMap.set(star.hip, [star.x, star.y, star.z]);
        }
      }

      this.needsRebuild = true;
      console.log(`[ConstellationLayer] Built HIP lookup: ${this.hipMap.size} stars`);
    } catch (err) {
      this.loadError = err instanceof Error ? err.message : String(err);
      console.error(`[ConstellationLayer] Failed to load catalog:`, err);
    } finally {
      this.loading = false;
    }
  }

  /** Build GL_LINES vertex data from constellation definitions */
  private rebuildVertexData(): void {
    const gl = this.gl;
    if (!gl || !this.vao || !this.vbo || !this.hipMap) return;

    // Collect all valid line segment positions
    const positions: number[] = [];
    let resolvedLines = 0;
    let missingLines = 0;

    // Filter constellations by visibility
    const visibleSet =
      this.params.visibleConstellations.length > 0
        ? new Set(this.params.visibleConstellations)
        : null; // null means all visible

    for (const constellation of CONSTELLATIONS) {
      // Skip if not in visible set (when filter is active)
      if (visibleSet && !visibleSet.has(constellation.abbr)) continue;

      for (const [hip1, hip2] of constellation.lines) {
        const pos1 = this.hipMap.get(hip1);
        const pos2 = this.hipMap.get(hip2);

        if (pos1 && pos2) {
          positions.push(pos1[0], pos1[1], pos1[2]);
          positions.push(pos2[0], pos2[1], pos2[2]);
          resolvedLines++;
        } else {
          missingLines++;
        }
      }
    }

    if (missingLines > 0) {
      console.warn(
        `[ConstellationLayer] ${missingLines} line segments have missing HIP IDs (${resolvedLines} resolved)`,
      );
    }

    const data = new Float32Array(positions);
    this.vertexCount = positions.length / 3; // Each vertex is 3 floats

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // aPosition (location 0): vec3
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 3 * 4, 0);

    gl.bindVertexArray(null);
    this.needsRebuild = false;
  }

  render(renderer: Renderer, params: RenderParams): void {
    const { gl } = renderer;
    if (!this.program || !this.vao) return;
    if (!this.hipMap || this.hipMap.size === 0) return;

    // Rebuild vertex data if needed
    if (this.needsRebuild) {
      this.rebuildVertexData();
    }

    if (this.vertexCount === 0) return;

    gl.useProgram(this.program);

    // Compute view-projection matrix
    const viewProj = mat4.create();
    mat4.multiply(viewProj, params.projectionMatrix as mat4, params.viewMatrix as mat4);
    gl.uniformMatrix4fv(this.uViewProjLoc, false, viewProj as Float32Array);

    // Set line color and opacity
    const [r, g, b] = hexToRgb(this.params.lineColor);
    gl.uniform3f(this.uColorLoc, r, g, b);
    gl.uniform1f(this.uOpacityLoc, this.params.opacity);

    // Set line width (note: many GPUs only support width=1)
    gl.lineWidth(this.params.lineWidth);

    // Enable alpha blending for translucent lines
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.LINES, 0, this.vertexCount);
    gl.bindVertexArray(null);
  }

  updateParams(params: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(params)) {
      if (key in this.params) {
        const k = key as keyof ConstellationParams;
        if (k === 'visibleConstellations') {
          const newVisible = value as string[];
          const newKey = [...newVisible].sort().join(',');
          if (newKey !== this.lastVisibleKey) {
            this.params.visibleConstellations = newVisible;
            this.lastVisibleKey = newKey;
            this.needsRebuild = true;
          }
        } else if (this.params[k] !== value) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this.params as any)[k] = value;
        }
      }
    }
  }

  getParams(): Record<string, unknown> {
    return {
      ...this.params,
      lineCount: this.vertexCount / 2,
      loading: this.loading,
      error: this.loadError,
    };
  }

  /** Get the number of rendered line segments */
  getLineCount(): number {
    return this.vertexCount / 2;
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
    this.hipMap = null;
  }
}
