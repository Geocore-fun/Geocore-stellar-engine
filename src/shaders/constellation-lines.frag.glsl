#version 300 es
/**
 * constellation-lines.frag.glsl
 *
 * Fragment shader for constellation stick figure lines.
 * Renders lines with configurable color and opacity.
 */

precision mediump float;

uniform vec3  uColor;
uniform float uOpacity;

out vec4 fragColor;

void main() {
  fragColor = vec4(uColor, uOpacity);
}
