#version 300 es
precision highp float;

// Fullscreen quad vertex shader.
// Takes clip-space positions and outputs a ray direction
// based on the inverse view-projection matrix.

layout(location = 0) in vec2 aPosition;

uniform mat4 uInvViewProj;

out vec3 vDirection;

void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);

  // Unproject from clip space to world space to get ray direction
  vec4 worldPos = uInvViewProj * vec4(aPosition, 1.0, 1.0);
  vDirection = normalize(worldPos.xyz / worldPos.w);
}
