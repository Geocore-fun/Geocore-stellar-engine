#version 300 es
precision highp float;

// Skybox preview fragment shader.
// Samples from a cubemap texture for preview display.

in vec3 vDirection;

uniform samplerCube uCubemap;

out vec4 fragColor;

void main() {
  fragColor = texture(uCubemap, normalize(vDirection));
}
