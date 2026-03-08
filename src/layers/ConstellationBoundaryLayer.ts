/**
 * ConstellationBoundaryLayer — renders IAU constellation boundary lines
 * as dashed lines on the sky sphere.
 *
 * Uses the boundary polygon data and renders GL_LINES with a dashed
 * fragment shader based on cumulative arc distance.
 */

import { CONSTELLATION_BOUNDARIES, raDecToCartesian } from '@/data/constellationBoundaries';
import type { RenderLayer, RenderParams } from '@/layers/RenderLayer';
import type { Renderer } from '@/renderer/Renderer';
import { mat4 } from 'gl-matrix';

import boundaryFragSrc from '@/shaders/constellation-boundary.frag.glsl?raw';
import boundaryVertSrc from '@/shaders/constellation-boundary.vert.glsl?raw';

import type { HexColor } from '@/types';
import { hexToRgb } from '@/utils/color';

export interface ConstellationBoundaryParams {
  enabled: boolean;
  /** Line opacity (0-1) */
  opacity: number;
  /** Line color as hex */
  lineColor: HexColor;
  /** Line width in pixels */
  lineWidth: number;
  /** Dash cycle length (angular radians on unit sphere) */
  dashLength: number;
  /** Fraction of dash that is visible (0-1) */
  dashRatio: number;
}

const DEFAULT_PARAMS: ConstellationBoundaryParams = {
  enabled: false,
  opacity: 0.15,
  lineColor: '#445588',
  lineWidth: 1.0,
  dashLength: 0.06,
  dashRatio: 0.5,
};

export class ConstellationBoundaryLayer implements RenderLayer {
  readonly id = 'constellation-boundaries';
  readonly name = 'Constellation Boundaries';
  enabled = false;
  order = 15.5; // Between catalog stars (15) and constellation lines (16)

  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private vbo: WebGLBuffer | null = null;
  private uViewProjLoc: WebGLUniformLocation | null = null;
  private uColorLoc: WebGLUniformLocation | null = null;
  private uOpacityLoc: WebGLUniformLocation | null = null;
  private uDashLengthLoc: WebGLUniformLocation | null = null;
  private uDashRatioLoc: WebGLUniformLocation | null = null;

  private params: ConstellationBoundaryParams = { ...DEFAULT_PARAMS };
  private gl: WebGL2RenderingContext | null = null;

  /** Number of line vertices (2 per segment) */
  private vertexCount = 0;

  init(renderer: Renderer): void {
    this.gl = renderer.gl;
    this.program = renderer.createProgram(boundaryVertSrc, boundaryFragSrc);
    const { gl } = renderer;

    this.uViewProjLoc = gl.getUniformLocation(this.program, 'uViewProj');
    this.uColorLoc = gl.getUniformLocation(this.program, 'uColor');
    this.uOpacityLoc = gl.getUniformLocation(this.program, 'uOpacity');
    this.uDashLengthLoc = gl.getUniformLocation(this.program, 'uDashLength');
    this.uDashRatioLoc = gl.getUniformLocation(this.program, 'uDashRatio');

    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();

    // Build vertex data immediately (no async catalog needed)
    this.buildVertexData();
  }

  /** Build GL_LINES vertex data from boundary polygon definitions */
  private buildVertexData(): void {
    const gl = this.gl;
    if (!gl || !this.vao || !this.vbo) return;

    // Each vertex has: [x, y, z, distance] = 4 floats
    // Each line segment has 2 vertices
    const vertexData: number[] = [];

    for (const boundary of CONSTELLATION_BOUNDARIES) {
      for (const polyline of boundary.segments) {
        // Track cumulative distance along the polyline
        let cumulativeDistance = 0;

        for (let i = 0; i < polyline.length - 1; i++) {
          const [ra1, dec1] = polyline[i];
          const [ra2, dec2] = polyline[i + 1];
          const p1 = raDecToCartesian(ra1, dec1);
          const p2 = raDecToCartesian(ra2, dec2);

          // Arc distance on unit sphere (angle between the two points)
          const dot = p1[0] * p2[0] + p1[1] * p2[1] + p1[2] * p2[2];
          const segmentDistance = Math.acos(Math.min(1, Math.max(-1, dot)));

          // Start vertex
          vertexData.push(p1[0], p1[1], p1[2], cumulativeDistance);
          // End vertex
          vertexData.push(p2[0], p2[1], p2[2], cumulativeDistance + segmentDistance);

          cumulativeDistance += segmentDistance;
        }
      }
    }

    const data = new Float32Array(vertexData);
    this.vertexCount = vertexData.length / 4; // Each vertex is 4 floats

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    const stride = 4 * 4; // 4 floats × 4 bytes

    // aPosition (location 0): vec3
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);

    // aDistance (location 1): float
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 1, gl.FLOAT, false, stride, 3 * 4);

    gl.bindVertexArray(null);

    console.log(`[ConstellationBoundaryLayer] Built ${this.vertexCount / 2} line segments`);
  }

  render(renderer: Renderer, params: RenderParams): void {
    const { gl } = renderer;
    if (!this.program || !this.vao || this.vertexCount === 0) return;

    gl.useProgram(this.program);

    // Compute view-projection matrix
    const viewProj = mat4.create();
    mat4.multiply(viewProj, params.projectionMatrix as mat4, params.viewMatrix as mat4);
    gl.uniformMatrix4fv(this.uViewProjLoc, false, viewProj as Float32Array);

    // Set line color and opacity
    const [r, g, b] = hexToRgb(this.params.lineColor);
    gl.uniform3f(this.uColorLoc, r, g, b);
    gl.uniform1f(this.uOpacityLoc, this.params.opacity);

    // Set dash parameters
    gl.uniform1f(this.uDashLengthLoc, this.params.dashLength);
    gl.uniform1f(this.uDashRatioLoc, this.params.dashRatio);

    // Set line width
    gl.lineWidth(this.params.lineWidth);

    // Enable alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.LINES, 0, this.vertexCount);
    gl.bindVertexArray(null);
  }

  updateParams(params: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(params)) {
      if (key in this.params) {
        const k = key as keyof ConstellationBoundaryParams;
        if (this.params[k] !== value) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this.params as any)[k] = value;
        }
      }
    }
  }

  getParams(): Record<string, unknown> {
    return {
      ...this.params,
      segmentCount: this.vertexCount / 2,
    };
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
  }
}
