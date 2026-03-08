#version 300 es
/**
 * constellation-labels.frag.glsl
 *
 * Fragment shader for constellation name labels.
 * Samples from a text atlas texture with configurable color and opacity.
 */

precision mediump float;

uniform sampler2D uAtlas;
uniform vec3  uColor;
uniform float uOpacity;

in vec2 vTexCoord;

out vec4 fragColor;

void main() {
  float alpha = texture(uAtlas, vTexCoord).r;

  // Smooth threshold for clean text edges
  alpha = smoothstep(0.1, 0.5, alpha);

  if (alpha < 0.01) discard;

  fragColor = vec4(uColor, alpha * uOpacity);
}
