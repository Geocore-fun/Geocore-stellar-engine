/**
 * ConstellationLabelLayer — renders constellation name labels on the sky sphere.
 *
 * Uses a Canvas 2D-generated text atlas texture and renders billboarded
 * quads at each constellation's centroid position (average of star positions).
 */

import { CONSTELLATIONS } from '@/data/constellationData';
import type { CatalogStar } from '@/data/loadCatalog';
import { loadCatalog } from '@/data/loadCatalog';
import type { RenderLayer, RenderParams } from '@/layers/RenderLayer';
import type { Renderer } from '@/renderer/Renderer';
import type { HexColor } from '@/types';
import { hexToRgb } from '@/utils/color';
import { mat4 } from 'gl-matrix';

import labelFragSrc from '@/shaders/constellation-labels.frag.glsl?raw';
import labelVertSrc from '@/shaders/constellation-labels.vert.glsl?raw';

export interface ConstellationLabelParams {
  enabled: boolean;
  /** Label opacity (0-1) */
  opacity: number;
  /** Label text color */
  color: HexColor;
  /** Label size multiplier */
  scale: number;
  /** Set of visible constellation abbreviations (empty = all visible) */
  visibleConstellations: string[];
}

const DEFAULT_PARAMS: ConstellationLabelParams = {
  enabled: true,
  opacity: 0.6,
  color: '#8899bb',
  scale: 1.0,
  visibleConstellations: [],
};

/** Atlas glyph info for one constellation label */
interface GlyphInfo {
  abbr: string;
  name: string;
  /** Position in the text atlas (normalized 0..1) */
  u: number;
  v: number;
  /** Size in atlas (normalized) */
  w: number;
  h: number;
  /** Pixel width/height for sizing */
  pxW: number;
  pxH: number;
}

export class ConstellationLabelLayer implements RenderLayer {
  readonly id = 'constellation-labels';
  readonly name = 'Constellation Labels';
  enabled = true;
  order = 17; // After constellation lines (16)

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

  private params: ConstellationLabelParams = { ...DEFAULT_PARAMS };
  private gl: WebGL2RenderingContext | null = null;

  private glyphs: GlyphInfo[] = [];
  private hipMap: Map<number, [number, number, number]> | null = null;
  private centroids: Map<string, [number, number, number]> = new Map();
  private indexCount = 0;
  private needsRebuild = true;
  private loading = false;
  private lastVisibleKey = '';

  /** Atlas dimensions */
  private static readonly ATLAS_SIZE = 1024;
  private static readonly FONT_SIZE = 18;
  private static readonly LINE_HEIGHT = 24;
  private static readonly PADDING = 4;

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

    // Build the text atlas
    this.buildAtlas();

    // Load star catalog for centroid computation
    this.loadCatalogAndBuild();
  }

  /** Generate a Canvas 2D text atlas with all constellation names */
  private buildAtlas(): void {
    const gl = this.gl;
    if (!gl) return;

    const size = ConstellationLabelLayer.ATLAS_SIZE;
    const fontSize = ConstellationLabelLayer.FONT_SIZE;
    const lineH = ConstellationLabelLayer.LINE_HEIGHT;
    const pad = ConstellationLabelLayer.PADDING;

    // Create offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Clear to transparent
    ctx.clearRect(0, 0, size, size);

    // Configure text rendering
    ctx.font = `${fontSize}px -apple-system, "SF Pro Display", "Inter", "Segoe UI", system-ui, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#ffffff';

    // Pack glyphs row by row
    let cursorX = pad;
    let cursorY = pad;
    this.glyphs = [];

    for (const c of CONSTELLATIONS) {
      const metrics = ctx.measureText(c.name);
      const textW = Math.ceil(metrics.width);
      const textH = lineH;

      // Wrap to next row if needed
      if (cursorX + textW + pad > size) {
        cursorX = pad;
        cursorY += textH + pad;
      }

      // Skip if we ran out of atlas space
      if (cursorY + textH > size) {
        console.warn(`[ConstellationLabelLayer] Atlas ran out of space at ${c.abbr}`);
        break;
      }

      // Render text
      ctx.fillText(c.name, cursorX, cursorY);

      // Store glyph info (normalized coordinates)
      this.glyphs.push({
        abbr: c.abbr,
        name: c.name,
        u: cursorX / size,
        v: cursorY / size,
        w: textW / size,
        h: textH / size,
        pxW: textW,
        pxH: textH,
      });

      cursorX += textW + pad * 2;
    }

    // Upload atlas to GPU as a single-channel (luminance) texture
    // Extract just the alpha/white channel
    const imageData = ctx.getImageData(0, 0, size, size);
    const alphaData = new Uint8Array(size * size);
    for (let i = 0; i < size * size; i++) {
      // Use the red channel as the alpha value (text is white)
      alphaData[i] = imageData.data[i * 4];
    }

    this.atlasTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, size, size, 0, gl.RED, gl.UNSIGNED_BYTE, alphaData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    console.log(`[ConstellationLabelLayer] Built atlas: ${this.glyphs.length} labels`);
  }

  /** Load catalog and compute constellation centroids */
  private async loadCatalogAndBuild(): Promise<void> {
    if (this.loading || this.hipMap) return;
    this.loading = true;

    try {
      const catalog: CatalogStar[] = await loadCatalog();

      // Build HIP ID → position lookup
      this.hipMap = new Map();
      for (const star of catalog) {
        if (star.hip > 0) {
          this.hipMap.set(star.hip, [star.x, star.y, star.z]);
        }
      }

      // Compute centroids for each constellation
      this.computeCentroids();
      this.needsRebuild = true;
    } catch (err) {
      console.error('[ConstellationLabelLayer] Failed to load catalog:', err);
    } finally {
      this.loading = false;
    }
  }

  /** Compute the centroid (average position) for each constellation */
  private computeCentroids(): void {
    if (!this.hipMap) return;

    for (const c of CONSTELLATIONS) {
      const positions: [number, number, number][] = [];

      // Collect unique star positions
      const uniqueHips = new Set<number>();
      for (const [h1, h2] of c.lines) {
        uniqueHips.add(h1);
        uniqueHips.add(h2);
      }

      for (const hip of uniqueHips) {
        const pos = this.hipMap.get(hip);
        if (pos) positions.push(pos);
      }

      if (positions.length === 0) continue;

      // Average position
      let cx = 0,
        cy = 0,
        cz = 0;
      for (const [x, y, z] of positions) {
        cx += x;
        cy += y;
        cz += z;
      }
      cx /= positions.length;
      cy /= positions.length;
      cz /= positions.length;

      // Normalize to unit sphere
      const len = Math.sqrt(cx * cx + cy * cy + cz * cz);
      if (len > 0.001) {
        cx /= len;
        cy /= len;
        cz /= len;
      }

      this.centroids.set(c.abbr, [cx, cy, cz]);
    }
  }

  /** Build vertex/index data for visible label quads */
  private rebuildVertexData(): void {
    const gl = this.gl;
    if (!gl || !this.vao || !this.vbo || !this.ibo) return;
    if (this.centroids.size === 0 || this.glyphs.length === 0) return;

    // Filter by visibility
    const visibleSet =
      this.params.visibleConstellations.length > 0
        ? new Set(this.params.visibleConstellations)
        : null;

    // Each label quad has 4 vertices, 6 indices
    // Vertex layout: position(3) + offset(2) + texcoord(2) + glyphSize(2) = 9 floats
    const vertices: number[] = [];
    const indices: number[] = [];
    let quadIndex = 0;

    for (const glyph of this.glyphs) {
      if (visibleSet && !visibleSet.has(glyph.abbr)) continue;

      const centroid = this.centroids.get(glyph.abbr);
      if (!centroid) continue;

      const [cx, cy, cz] = centroid;

      // Aspect ratio of this glyph
      const aspect = glyph.pxW / glyph.pxH;

      // Normalized glyph size for screen-space sizing
      // Base size in clip-space units
      const glyphW = 0.08 * aspect;
      const glyphH = 0.08;

      // 4 corners of the quad: TL, TR, BL, BR
      const corners = [
        { ox: -1, oy: 1, u: glyph.u, v: glyph.v }, // Top-left
        { ox: 1, oy: 1, u: glyph.u + glyph.w, v: glyph.v }, // Top-right
        { ox: -1, oy: -1, u: glyph.u, v: glyph.v + glyph.h }, // Bottom-left
        { ox: 1, oy: -1, u: glyph.u + glyph.w, v: glyph.v + glyph.h }, // Bottom-right
      ];

      for (const corner of corners) {
        vertices.push(
          cx,
          cy,
          cz, // position
          corner.ox,
          corner.oy, // offset
          corner.u,
          corner.v, // texcoord
          glyphW,
          glyphH, // glyph size
        );
      }

      // Two triangles: TL-TR-BL, TR-BR-BL
      const base = quadIndex * 4;
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
      quadIndex++;
    }

    const vData = new Float32Array(vertices);
    const iData = new Uint16Array(indices);

    // vertexCount = quadIndex * 4 (tracked implicitly via indexCount)
    this.indexCount = indices.length;

    gl.bindVertexArray(this.vao);

    // Upload vertex data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vData, gl.STATIC_DRAW);

    const stride = 9 * 4; // 9 floats per vertex.

    // aPosition (location 0): vec3
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);

    // aOffset (location 1): vec2
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 3 * 4);

    // aTexCoord (location 2): vec2
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 5 * 4);

    // aGlyphSize (location 3): vec2
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 2, gl.FLOAT, false, stride, 7 * 4);

    // Upload index data
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, iData, gl.STATIC_DRAW);

    gl.bindVertexArray(null);
    this.needsRebuild = false;
  }

  render(renderer: Renderer, params: RenderParams): void {
    const { gl } = renderer;
    if (!this.program || !this.vao || !this.atlasTexture) return;
    if (this.centroids.size === 0) return;

    if (this.needsRebuild) {
      this.rebuildVertexData();
    }

    if (this.indexCount === 0) return;

    gl.useProgram(this.program);

    // View-projection matrix
    const viewProj = mat4.create();
    mat4.multiply(viewProj, params.projectionMatrix as mat4, params.viewMatrix as mat4);
    gl.uniformMatrix4fv(this.uViewProjLoc, false, viewProj as Float32Array);

    // Uniforms
    const [r, g, b] = hexToRgb(this.params.color);
    gl.uniform3f(this.uColorLoc, r, g, b);
    gl.uniform1f(this.uOpacityLoc, this.params.opacity);
    gl.uniform1f(this.uScaleLoc, this.params.scale);
    gl.uniform1f(this.uFaceSizeLoc, params.faceSize);

    // Bind atlas texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.atlasTexture);
    gl.uniform1i(this.uAtlasLoc, 0);

    // Enable alpha blending
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.bindVertexArray(this.vao);
    gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
  }

  updateParams(params: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(params)) {
      if (key in this.params) {
        const k = key as keyof ConstellationLabelParams;
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
    this.hipMap = null;
    this.centroids.clear();
  }
}
