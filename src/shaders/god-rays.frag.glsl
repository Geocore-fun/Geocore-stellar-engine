#version 300 es
precision highp float;

// God rays (volumetric light scattering approximation).
// Applies radial blur from the sun position to simulate
// light scattering through atmosphere / dust.

in vec2 vUV;
out vec4 fragColor;

uniform sampler2D uScene;      // Scene texture (copy of face before god rays)
uniform vec2 uSunUV;           // Sun projected position in face UV space
uniform float uSunVisible;     // 1.0 if sun projects onto this face
uniform float uExposure;       // Overall ray brightness
uniform float uDecay;          // Decay factor along ray (0.9-1.0)
uniform float uDensity;        // Ray sampling density
uniform float uWeight;         // Individual sample weight

#define NUM_SAMPLES 64

void main() {
    // Direction from current pixel toward sun
    vec2 deltaUV = (uSunUV - vUV) * uDensity / float(NUM_SAMPLES);
    vec2 sampleUV = vUV;

    vec3 color = vec3(0.0);
    float illuminationDecay = 1.0;

    for (int i = 0; i < NUM_SAMPLES; i++) {
        sampleUV += deltaUV;

        // Clamp to avoid sampling outside face
        vec3 samp = texture(uScene, clamp(sampleUV, 0.0, 1.0)).rgb;
        samp *= illuminationDecay * uWeight;
        color += samp;

        illuminationDecay *= uDecay;
    }

    // Analytical radial glow from sun — provides smooth cross-face continuity.
    // On the sun's face the scene-based radial blur dominates; on adjacent
    // faces where the scene has no bright sun pixels, this analytical term
    // fills in a smooth volumetric glow that matches at face boundaries.
    float sunDist = length(vUV - uSunUV);
    float glow = exp(-sunDist * 2.5) * uWeight * 0.4;
    color += vec3(glow);

    fragColor = vec4(color * uExposure, 1.0);
}
