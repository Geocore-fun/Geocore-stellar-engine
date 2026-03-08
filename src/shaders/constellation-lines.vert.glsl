#version 300 es
/**
 * constellation-lines.vert.glsl
 *
 * Vertex shader for constellation stick figure lines.
 * Takes 3D positions on the star sphere and projects them
 * using the same view-projection as catalog stars.
 */

layout(location = 0) in vec3 aPosition;

uniform mat4 uViewProj;

void main() {
  gl_Position = uViewProj * vec4(aPosition, 1.0);
}
