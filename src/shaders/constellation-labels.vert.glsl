#version 300 es
/**
 * constellation-labels.vert.glsl
 *
 * Vertex shader for constellation name labels rendered as billboards.
 * Each label is a screen-aligned quad at the constellation's centroid position.
 */

precision highp float;

layout(location = 0) in vec3 aPosition;   // Centroid position on sky sphere
layout(location = 1) in vec2 aOffset;     // Quad corner offset (-1..1)
layout(location = 2) in vec2 aTexCoord;   // UV into text atlas
layout(location = 3) in vec2 aGlyphSize;  // Glyph size in atlas (normalized)

uniform mat4 uViewProj;
uniform float uScale;        // Label size multiplier
uniform float uFaceSize;     // Face resolution for scaling

out vec2 vTexCoord;

void main() {
  // Project centroid to clip space
  vec4 clipPos = uViewProj * vec4(aPosition, 1.0);

  // Billboard offset in screen space (scales with resolution)
  float labelScale = uScale * uFaceSize / 1024.0;
  vec2 screenOffset = aOffset * aGlyphSize * labelScale;

  // Apply offset in clip space (NDC-relative)
  clipPos.xy += screenOffset * clipPos.w;

  gl_Position = clipPos;
  vTexCoord = aTexCoord;
}
