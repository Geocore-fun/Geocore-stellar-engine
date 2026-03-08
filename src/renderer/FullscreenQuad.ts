/**
 * Full-screen quad geometry for fragment-shader-only rendering.
 *
 * Renders a triangle strip covering the entire viewport.
 * This is used by all render layers that compute pixels purely in the fragment shader.
 */

export class FullscreenQuad {
  private gl: WebGL2RenderingContext;
  private vao: WebGLVertexArrayObject;
  private vbo: WebGLBuffer;

  constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;

    const vao = gl.createVertexArray();
    if (!vao) throw new Error('Failed to create VAO');
    this.vao = vao;

    const vbo = gl.createBuffer();
    if (!vbo) throw new Error('Failed to create VBO');
    this.vbo = vbo;

    // Two-triangle fullscreen quad (positions only)
    // Using clip-space coordinates so no projection matrix needed
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  /** Draw the fullscreen quad (bind your program first) */
  draw(): void {
    const { gl } = this;
    gl.bindVertexArray(this.vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
  }

  /** Clean up GL resources */
  dispose(): void {
    const { gl } = this;
    gl.deleteBuffer(this.vbo);
    gl.deleteVertexArray(this.vao);
  }
}
