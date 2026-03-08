#version 300 es
precision highp float;

// Catalog star vertex shader.
// Renders real HYG catalog stars as GL_POINTS with per-star
// position, size, and color derived from B-V color index.

layout(location = 0) in vec3 aPosition;
layout(location = 1) in float aSize;
layout(location = 2) in vec3 aColor;

uniform mat4 uViewProj;
uniform float uFaceSize;
uniform float uBrightness;

out vec3 vColor;
out float vBrightness;

void main() {
  gl_Position = uViewProj * vec4(aPosition, 1.0);

  // Scale point size by resolution
  gl_PointSize = aSize * uFaceSize / 1024.0;

  // Clamp to avoid oversized points
  gl_PointSize = clamp(gl_PointSize, 0.5, 16.0);

  vColor = aColor;
  vBrightness = uBrightness;
}
