#version 300 es
precision highp float;

// Background gradient shader.
// Renders a subtle gradient or solid color as the base layer.

in vec3 vDirection;

uniform vec3 uColor;

out vec4 fragColor;

void main() {
  fragColor = vec4(uColor, 1.0);
}
