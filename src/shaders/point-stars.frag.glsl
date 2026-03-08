#version 300 es
precision highp float;

// Point stars fragment shader.
// Renders each star as a soft circular point with brightness falloff.

in vec3 vColor;
in float vBrightness;

out vec4 fragColor;

void main() {
  // Distance from center of point sprite [0..1]
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord) * 2.0;

  // Soft circular falloff
  float alpha = 1.0 - smoothstep(0.0, 1.0, dist);
  alpha *= vBrightness;

  fragColor = vec4(vColor * vBrightness, alpha);
}
