#version 300 es
precision highp float;

// Point stars vertex shader.
// Renders stars as GL_POINTS with per-instance position, size, and color.

layout(location = 0) in vec3 aPosition;
layout(location = 1) in float aSize;
layout(location = 2) in vec3 aColor;
layout(location = 3) in float aBrightness;

uniform mat4 uViewProj;
uniform float uFaceSize;

out vec3 vColor;
out float vBrightness;

void main() {
  gl_Position = uViewProj * vec4(aPosition, 1.0);
  gl_PointSize = aSize * uFaceSize / 1024.0;
  vColor = aColor;
  vBrightness = aBrightness;
}
