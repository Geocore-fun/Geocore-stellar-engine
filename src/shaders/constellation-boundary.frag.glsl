#version 300 es
/**
 * constellation-boundary.frag.glsl
 *
 * Fragment shader for constellation boundary lines.
 * Renders dashed lines by discarding fragments at regular intervals
 * based on a cumulative distance attribute.
 */

precision mediump float;

uniform vec3  uColor;
uniform float uOpacity;
uniform float uDashLength;  // length of dash+gap cycle
uniform float uDashRatio;   // fraction of cycle that is visible (0-1)

in float vDistance;

out vec4 fragColor;

void main() {
  // Fraction within the dash cycle
  float t = fract(vDistance / uDashLength);
  // Discard gap portion
  if (t > uDashRatio) discard;

  fragColor = vec4(uColor, uOpacity);
}
