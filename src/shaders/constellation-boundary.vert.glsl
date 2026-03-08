#version 300 es
/**
 * constellation-boundary.vert.glsl
 *
 * Vertex shader for constellation boundary lines.
 * Passes 3D position and a cumulative distance attribute
 * for the dashed-line fragment shader.
 */

layout(location = 0) in vec3 aPosition;
layout(location = 1) in float aDistance;

uniform mat4 uViewProj;

out float vDistance;

void main() {
  vDistance = aDistance;
  gl_Position = uViewProj * vec4(aPosition, 1.0);
}
