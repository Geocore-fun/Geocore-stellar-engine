#version 300 es
precision highp float;

// Catalog star fragment shader.
// Renders each star as a soft circular point with brightness-weighted alpha.
// Uses physically-inspired Airy-like glow for brighter stars.

in vec3 vColor;
in float vBrightness;

out vec4 fragColor;

void main() {
  // Distance from center of point sprite [0..1]
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord) * 2.0;

  // Core + halo profile (Airy-like approximation)
  // Tight core with broader glow
  float core = 1.0 - smoothstep(0.0, 0.4, dist);
  float halo = 1.0 - smoothstep(0.0, 1.0, dist);
  float alpha = mix(halo * 0.6, 1.0, core);

  alpha *= vBrightness;

  // Discard nearly invisible fragments
  if (alpha < 0.005) discard;

  fragColor = vec4(vColor * vBrightness, alpha);
}
