#version 300 es
precision highp float;

// Simple post-process vertex shader.
// Outputs clip-space positions and UV coordinates
// for screen-space effect passes (bloom, blur, etc.).

layout(location = 0) in vec2 aPosition;

out vec2 vUV;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vUV = aPosition * 0.5 + 0.5;
}
