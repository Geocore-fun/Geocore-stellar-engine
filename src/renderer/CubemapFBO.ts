/**
 * Manages a cubemap FBO for off-screen rendering.
 *
 * Creates a framebuffer with a cube map texture attached.
 * Allows binding each face for rendering and reading back pixels.
 */

import type { CubeFace } from '@/types';
import { CUBE_FACES } from '@/types';

/** GL constants for cubemap face targets */
const FACE_TARGETS: Record<CubeFace, number> = {
  px: 0x8515, // GL_TEXTURE_CUBE_MAP_POSITIVE_X
  nx: 0x8516,
  py: 0x8517,
  ny: 0x8518,
  pz: 0x8519,
  nz: 0x851a,
};

export class CubemapFBO {
  private gl: WebGL2RenderingContext;
  private fbo: WebGLFramebuffer;
  private texture: WebGLTexture;
  private _size: number;

  constructor(gl: WebGL2RenderingContext, size: number) {
    this.gl = gl;
    this._size = size;

    // Create cubemap texture
    const tex = gl.createTexture();
    if (!tex) throw new Error('Failed to create cubemap texture');
    this.texture = tex;

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, tex);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Allocate storage for all 6 faces
    for (const face of CUBE_FACES) {
      gl.texImage2D(
        FACE_TARGETS[face],
        0,
        gl.RGBA8,
        size,
        size,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
    }

    // Create framebuffer
    const fbo = gl.createFramebuffer();
    if (!fbo) throw new Error('Failed to create framebuffer');
    this.fbo = fbo;

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  }

  get size(): number {
    return this._size;
  }

  get glTexture(): WebGLTexture {
    return this.texture;
  }

  /** Get the underlying GL framebuffer object */
  get glFramebuffer(): WebGLFramebuffer {
    return this.fbo;
  }

  /** Bind a specific face for rendering */
  bindFace(face: CubeFace): void {
    const { gl } = this;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      FACE_TARGETS[face],
      this.texture,
      0,
    );
    gl.viewport(0, 0, this._size, this._size);
  }

  /** Unbind the FBO (render to canvas) */
  unbind(): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }

  /** Read pixels from a specific face */
  readFace(face: CubeFace): Uint8Array {
    const { gl } = this;
    this.bindFace(face);
    const pixels = new Uint8Array(this._size * this._size * 4);
    gl.readPixels(0, 0, this._size, this._size, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    this.unbind();
    return pixels;
  }

  /** Resize the cubemap (recreates storage) */
  resize(newSize: number): void {
    const { gl } = this;
    this._size = newSize;

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
    for (const face of CUBE_FACES) {
      gl.texImage2D(
        FACE_TARGETS[face],
        0,
        gl.RGBA8,
        newSize,
        newSize,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
      );
    }
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
  }

  /** Clean up GL resources */
  dispose(): void {
    const { gl } = this;
    gl.deleteFramebuffer(this.fbo);
    gl.deleteTexture(this.texture);
  }
}
