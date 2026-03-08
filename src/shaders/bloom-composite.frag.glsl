#version 300 es
precision highp float;

// Bloom compositing pass.
// Additively blends the blurred bloom texture onto the original scene.

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uIntensity;

void main() {
  vec3 scene = texture(uScene, vUV).rgb;
  vec3 bloom = texture(uBloom, vUV).rgb;
  fragColor = vec4(scene + bloom * uIntensity, 1.0);
}
