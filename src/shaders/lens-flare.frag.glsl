#version 300 es
precision highp float;

// Lens flare post-processing.
// Renders ghost elements and halo ring along the sun-center axis.
// Purely analytical — no scene sampling required.

in vec2 vUV;
out vec4 fragColor;

uniform vec2 uSunUV;          // Sun projected position in face UV space
uniform float uSunVisible;    // 1.0 if sun projects onto this face
uniform float uIntensity;     // Overall intensity multiplier
uniform int uGhostCount;      // Number of ghost elements (1-8)
uniform float uGhostSpacing;  // Spacing between ghosts along axis
uniform float uHaloRadius;    // Halo ring radius from center
uniform float uHaloIntensity; // Halo ring brightness
uniform float uChromatic;     // Chromatic aberration amount

void main() {
    vec2 center = vec2(0.5);
    vec2 ghostVec = center - uSunUV;
    vec3 flare = vec3(0.0);

    // ── Ghost elements ──
    // Ghosts appear at mirrored positions along the sun-center axis
    for (int i = 0; i < 8; i++) {
        if (i >= uGhostCount) break;

        float t = float(i + 1) * uGhostSpacing;
        vec2 ghostPos = uSunUV + ghostVec * t * 2.0;

        // Varying ghost sizes: inner ghosts smaller, outer larger
        float baseSize = 0.025 + float(i) * 0.01;
        float d = length(vUV - ghostPos);

        // Soft circular ghost with squared falloff
        float ghost = max(1.0 - d / baseSize, 0.0);
        ghost = ghost * ghost;

        // Chromatic aberration: offset R and B channels
        float ca = uChromatic * 0.018;
        vec2 caDir = normalize(ghostVec + vec2(0.001));

        float dR = length(vUV - ghostPos + caDir * ca);
        float dB = length(vUV - ghostPos - caDir * ca);

        float ghostR = max(1.0 - dR / baseSize, 0.0);
        ghostR *= ghostR;
        float ghostB = max(1.0 - dB / baseSize, 0.0);
        ghostB *= ghostB;

        // Alternate warm/cool tint per ghost
        float warm = mod(float(i), 2.0) < 1.0 ? 1.0 : 0.7;

        flare.r += ghostR * warm;
        flare.g += ghost * 0.85;
        flare.b += ghostB * (2.0 - warm);
    }

    // ── Halo ring ──
    float distFromCenter = length(vUV - center);
    float haloWidth = 0.04;

    // Chromatic halo: slight per-channel radius offset
    float haloR = max(1.0 - abs(distFromCenter - uHaloRadius * 0.97) / haloWidth, 0.0);
    float haloG = max(1.0 - abs(distFromCenter - uHaloRadius       ) / haloWidth, 0.0);
    float haloB = max(1.0 - abs(distFromCenter - uHaloRadius * 1.03) / haloWidth, 0.0);

    flare.r += pow(haloR, 3.0) * uHaloIntensity;
    flare.g += pow(haloG, 3.0) * uHaloIntensity;
    flare.b += pow(haloB, 3.0) * uHaloIntensity;

    // ── Anamorphic streak (horizontal bar through sun) ──
    float streak = exp(-abs(vUV.y - uSunUV.y) * 35.0)
                 * exp(-abs(vUV.x - uSunUV.x) * 2.5)
                 * 0.12;
    flare += vec3(streak);

    fragColor = vec4(flare * uIntensity, 1.0);
}
