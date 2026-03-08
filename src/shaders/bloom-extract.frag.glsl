#version 300 es
precision highp float;

// Bloom bright-pixel extraction pass.
// Extracts pixels above a luminance threshold with soft knee
// to create the bloom source.

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uScene;
uniform float uThreshold;
uniform float uSoftKnee;

void main() {
  vec3 color = texture(uScene, vUV).rgb;

  // Perceived luminance (Rec. 709)
  float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));

  // Soft threshold with quadratic knee for smooth falloff
  float knee = uThreshold * uSoftKnee;
  float soft = luma - uThreshold + knee;
  soft = clamp(soft, 0.0, 2.0 * knee);
  soft = soft * soft / (4.0 * knee + 1e-5);

  float contribution = max(soft, luma - uThreshold);
  contribution /= max(luma, 1e-5);

  fragColor = vec4(color * max(contribution, 0.0), 1.0);
}
