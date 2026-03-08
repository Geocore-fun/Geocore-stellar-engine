/**
 * NamedStarLabelLayer — renders named star labels as billboarded text quads.
 *
 * Loads named-stars.json and resolves positions from the HYG catalog,
 * then renders text labels at each named star's position using a
 * Canvas 2D-generated texture atlas.
 */

import type { NamedStar } from '@/data/loadCatalog';
import { loadCatalog, loadNamedStars } from '@/data/loadCatalog';
import type { RenderLayer, RenderParams } from '@/layers/RenderLayer';
import type { Renderer } from '@/renderer/Renderer';
import type { HexColor } from '@/types';
import { hexToRgb } from '@/utils/color';
import { mat4 } from 'gl-matrix';

import labelFragSrc from '@/shaders/constellation-labels.frag.glsl?raw';
import labelVertSrc from '@/shaders/constellation-labels.vert.glsl?raw';

export interface NamedStarLabelParams {
  enabled: boolean;
  /** Label opacity (0-1) */
  opacity: number;
  /** Label text color */
  color: HexColor;
  /** Label size multiplier */
  scale: number;
  /** Maximum magnitude for labeled stars (brighter = lower value) */
  magnitudeLimit: number;
}

const DEFAULT_PARAMS: NamedStarLabelParams = {
  enabled: true,
  opacity: 0.7,
  color: '#ccddee',
  scale: 0.8,
  magnitudeLimit: 3.0,
};

/** Atlas glyph info for one star label */
interface StarGlyphInfo {
  name: string;
  hip: number;
  mag: number;
  /** Atlas UV coordinates (normalized) */
  u: number;
  v: number;
  w: number;
  h: number;
  pxW: number;
  pxH: number;
}

const SPHERE_RADIUS = 50; // Must match loadCatalog's SPHERE_RADIUS

export class NamedStarLabelLayer implements RenderLayer {
  readonly id = 'named-star-labels';
  readonly name = 'Named Star Labels';
  enabled = true;
  order = 14; // Before catalog stars (15)

  private program: WebGLProgram | null = null;
  private vao: WebGLVertexArrayObject | null = null;
  private vbo: WebGLBuffer | null = null;
  private ibo: WebGLBuffer | null = null;
  private atlasTexture: WebGLTexture | null = null;

  private uViewProjLoc: WebGLUniformLocation | null = null;
  private uAtlasLoc: WebGLUniformLocation | null = null;
  private uColorLoc: WebGLUniformLocation | null = null;
  private uOpacityLoc: WebGLUniformLocation | null = null;
  private uScaleLoc: WebGLUniformLocation | null = null;
  private uFaceSizeLoc: WebGLUniformLocation | null = null;

  private params: NamedStarLabelParams = { ...DEFAULT_PARAMS };
  private gl: WebGL2RenderingContext | null = null;

  private glyphs: StarGlyphInfo[] = [];
  private namedStars: NamedStar[] = [];
  private hipPositions: Map<number, [number, number, number]> = new Map();
  private indexCount = 0;
  private needsRebuild = true;
  private loading = false;
  private lastMagLimit = -999;

  private static readonly ATLAS_SIZE = 2048;
  private static readonly FONT_SIZE = 14;
  private static readonly LINE_HEIGHT = 18;
  private static readonly PADDING = 3;

  init(renderer: Renderer): void {
    this.gl = renderer.gl;
    this.program = renderer.createProgram(labelVertSrc, labelFragSrc);
    const { gl } = renderer;

    this.uViewProjLoc = gl.getUniformLocation(this.program, 'uViewProj');
    this.uAtlasLoc = gl.getUniformLocation(this.program, 'uAtlas');
    this.uColorLoc = gl.getUniformLocation(this.program, 'uColor');
    this.uOpacityLoc = gl.getUniformLocation(this.program, 'uOpacity');
    this.uScaleLoc = gl.getUniformLocation(this.program, 'uScale');
    this.uFaceSizeLoc = gl.getUniformLocation(this.program, 'uFaceSize');

    this.vao = gl.createVertexArray();
    this.vbo = gl.createBuffer();
    this.ibo = gl.createBuffer();

    this.loadData();
  }

  /** Load named stars and catalog data */
  private async loadData(): Promise<void> {
    if (this.loading) return;
    this.loading = true;

    try {
      const [namedStars, catalog] = await Promise.all([loadNamedStars(), loadCatalog()]);

      this.namedStars = namedStars.filter((s) => s.hip > 0); // Skip Sol

      // Build HIP → position lookup
      this.hipPositions = new Map();
      for (const star of catalog) {
        if (star.hip > 0) {
          this.hipPositions.set(star.hip, [star.x, star.y, star.z]);
        }
      }

      // Also compute positions for named stars that might not be in binary catalog
      for (const ns of this.namedStars) {
        if (!this.hipPositions.has(ns.hip) && ns.hip > 0) {
          const cosDec = Math.cos(ns.decrad);
          const x = SPHERE_RADIUS * cosDec * Math.cos(ns.rarad);
          const y = SPHERE_RADIUS * Math.sin(ns.decrad);
          const z = SPHERE_RADIUS * cosDec * Math.sin(ns.rarad);
          this.hipPositions.set(ns.hip, [x, y, z]);
        }
      }

      this.buildAtlas();
      this.needsRebuild = true;
      console.log(`[NamedStarLabelLayer] Loaded ${this.namedStars.length} named stars`);
    } catch (err) {
      console.error('[NamedStarLabelLayer] Failed to load data:', err);
    } finally {
      this.loading = false;
    }
  }

  /** Generate text atlas with all named star names */
  private buildAtlas(): void {
    const gl = this.gl;
    if (!gl) return;

    const size = NamedStarLabelLayer.ATLAS_SIZE;
    const fontSize = NamedStarLabelLayer.FONT_SIZE;
    const lineH = NamedStarLabelLayer.LINE_HEIGHT;
    const pad = NamedStarLabelLayer.PADDING;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, size, size);
    ctx.font = `${fontSize}px -apple-system, "SF Pro Display", "Inter", "Segoe UI", system-ui, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff';

    let cursorX = pad;
    let cursorY = pad;
    this.glyphs = [];

    // Sort by magnitude (brightest first) for atlas priority
    const sorted = [...this.namedStars].sort((a, b) => a.mag - b.mag);

    for (const star of sorted) {
      const metrics = ctx.measureText(star.name);
      const textW = Math.ceil(metrics.width);
      const textH = lineH;

      if (cursorX + textW + pad > size) {
        cursorX = pad;
        cursorY += textH + pad;
      }

      if (cursorY + textH > size) break;

      ctx.fillText(star.name, cursorX, cursorY);

      this.glyphs.push({
        name: star.name,
        hip: star.hip,
        mag: star.mag,
        u: cursorX / size,
        v: cursorY / size,
        w: textW / size,
        h: textH / size,
        pxW: textW,
        pxH: textH,
      });

      cursorX += textW + pad * 2;
    }

    // Upload as single-channel texture
    const imageData = ctx.getImageData(0, 0, size, size);
    const alphaData = new Uint8Array(size * size);
    for (let i = 0; i < size * size; i++) {
      alphaData[i] = imageData.data[i * 4];
    }

    this.atlasTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, size, size, 0, gl.RED, gl.UNSIGNED_BYTE, alphaData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    console.log(`[NamedStarLabelLayer] Built atlas: ${this.glyphs.length} star labels`);
  }

  /** Build vertex/index data for label quads filtered by magnitude */
  private rebuildVertexData(): void {
    const gl = this.gl;
    if (!gl || !this.vao || !this.vbo || !this.ibo) return;
    if (this.glyphs.length === 0) return;

    const vertices: number[] = [];
    const indices: number[] = [];
    let quadIndex = 0;

    for (const glyph of this.glyphs) {
      // Filter by magnitude limit
      if (glyph.mag > this.params.magnitudeLimit) continue;

      const pos = this.hipPositions.get(glyph.hip);
      if (!pos) continue;

      const [cx, cy, cz] = pos;
      const aspect = glyph.pxW / glyph.pxH;

      // Offset the label slightly upward from the star position
      const glyphW = 0.06 * aspect;
      const glyphH = 0.06;

      const corners = [
        { ox: -1, oy: 2.5, u: glyph.u, v: glyph.v }, // Offset up
        { ox: 1, oy: 2.5, u: glyph.u + glyph.w, v: glyph.v },
        { ox: -1, oy: 0.5, u: glyph.u, v: glyph.v + glyph.h },
        { ox: 1, oy: 0.5, u: glyph.u + glyph.w, v: glyph.v + glyph.h },
      ];

      for (const corner of corners) {
        vertices.push(cx, cy, cz, corner.ox, corner.oy, corner.u, corner.v, glyphW, glyphH);
      }

      const base = quadIndex * 4;
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      quadIndex++;
    }

    const vData = new Float32Array(vertices);
    const iData = new Uint16Array(indices);
    this.indexCount = indices.length;

    gl.bindVertexArray(this.vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vData, gl.STATIC_DRAW);

    const stride = 9 * 4;

    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);

    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 3 * 4);

    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 5 * 4);

    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 2, gl.FLOAT, false, stride, 7 * 4);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, iData, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
    this.needsRebuild = false;
    this.lastMagLimit = this.params.magnitudeLimit;
  }

  render(renderer: Renderer, params: RenderParams): void {
    const { gl } = renderer;
    if (!this.program || !this.vao || !this.atlasTexture) return;
    if (this.glyphs.length === 0) return;

    // Rebuild if magnitude limit changed
    if (this.params.magnitudeLimit !== this.lastMagLimit) {
      this.needsRebuild = true;
    }

    if (this.needsRebuild) {
      this.rebuildVertexData();
    }

    if (this.indexCount === 0) return;

    gl.useProgram(this.program);

    const viewProj = mat4.create();
    mat4.multiply(viewProj, params.projectionMatrix as mat4, params.viewMatrix as mat4);
    gl.uniformMatrix4fv(this.uViewProjLoc, false, viewProj as Float32Array);

    const [r, g, b] = hexToRgb(this.params.color);
    gl.uniform3f(this.uColorLoc, r, g, b);
    gl.uniform1f(this.uOpacityLoc, this.params.opacity);
    gl.uniform1f(this.uScaleLoc, this.params.scale);
    gl.uniform1f(this.uFaceSizeLoc, params.faceSize);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
    gl.uniform1i(this.uAtlasLoc, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }

  updateParams(params: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(params)) {
      if (key in this.params) {
        const k = key as keyof NamedStarLabelParams;
        if (this.params[k] !== value) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (this.params as any)[k] = value;
          if (k === 'magnitudeLimit') {
            this.needsRebuild = true;
          }
        }
      }
    }
  }

  getParams(): Record<string, unknown> {
    return {
      ...this.params,
      labelCount: this.indexCount / 6,
      loading: this.loading,
    };
  }

  dispose(): void {
    const gl = this.gl;
    if (gl) {
      if (this.vbo) gl.deleteBuffer(this.vbo);
      if (this.ibo) gl.deleteBuffer(this.ibo);
      if (this.vao) gl.deleteVertexArray(this.vao);
      if (this.atlasTexture) gl.deleteTexture(this.atlasTexture);
      if (this.program) gl.deleteProgram(this.program);
    }
    this.program = null;
    this.vao = null;
    this.vbo = null;
    this.ibo = null;
    this.atlasTexture = null;
    this.hipPositions.clear();
  }
}
