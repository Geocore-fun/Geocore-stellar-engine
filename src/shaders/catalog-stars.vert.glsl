#version 300 es
precision highp float;

// Catalog star vertex shader.
// Renders real HYG catalog stars as GL_POINTS with per-star
// position, size, and color derived from B-V color index.
// Includes seed-based twinkle (per-star brightness variation).

layout(location = 0) in vec3 aPosition;
layout(location = 1) in float aSize;
layout(location = 2) in vec3 aColor;

uniform mat4 uViewProj;
uniform float uFaceSize;
uniform float uBrightness;
uniform bool uTwinkleEnabled;
uniform float uTwinkleAmount;   // 0-1: max brightness variation
uniform float uTwinkleSeed;     // seed for variation pattern

out vec3 vColor;
out float vBrightness;
out float vStarSize;

// Simple hash for per-star pseudo-random value
float hash(vec3 p, float seed) {
  p = fract(p * vec3(443.897, 441.423, 437.195));
  p += dot(p, p.yzx + 19.19 + seed);
  return fract((p.x + p.y) * p.z);
}

void main() {
  gl_Position = uViewProj * vec4(aPosition, 1.0);

  // Scale point size by resolution
  float scaledSize = aSize * uFaceSize / 1024.0;

  // Clamp to avoid oversized points
  gl_PointSize = clamp(scaledSize, 0.5, 16.0);

  // Compute twinkle factor (seed-based, deterministic per star)
  float twinkle = 1.0;
  if (uTwinkleEnabled) {
    float h = hash(aPosition, uTwinkleSeed);
    twinkle = 1.0 - uTwinkleAmount * (h * 0.8 + 0.1);
    // Also slightly vary point size
    gl_PointSize *= mix(1.0, twinkle, 0.3);
  }

  vColor = aColor;
  vBrightness = uBrightness * twinkle;
  vStarSize = aSize; // original unscaled size for spike brightness
}
