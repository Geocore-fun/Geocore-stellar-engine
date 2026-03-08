#version 300 es
precision highp float;

// Catalog star fragment shader.
// Renders each star as a soft circular point with brightness-weighted alpha.
// Optionally adds diffraction spikes (cross pattern) on bright stars.

in vec3 vColor;
in float vBrightness;
in float vStarSize;

// Diffraction spike uniforms
uniform bool uSpikesEnabled;
uniform float uSpikeLength;     // 0-1: fraction of point size
uniform float uSpikeBrightness; // 0-2: intensity multiplier
uniform float uSpikeRotation;   // radians
uniform float uSpikeThreshold;  // minimum star size for spikes

out vec4 fragColor;

void main() {
  // Distance from center of point sprite [0..1]
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord) * 2.0;

  // Core + halo profile (Airy-like approximation)
  float core = 1.0 - smoothstep(0.0, 0.4, dist);
  float halo = 1.0 - smoothstep(0.0, 1.0, dist);
  float alpha = mix(halo * 0.6, 1.0, core);

  // Diffraction spikes (4-point cross pattern)
  if (uSpikesEnabled && vStarSize >= uSpikeThreshold) {
    // Rotate spike coordinate frame
    float cosR = cos(uSpikeRotation);
    float sinR = sin(uSpikeRotation);
    vec2 rotCoord = vec2(
      coord.x * cosR - coord.y * sinR,
      coord.x * sinR + coord.y * cosR
    );

    // Distance from X and Y axes (forms cross pattern)
    float dX = abs(rotCoord.y);
    float dY = abs(rotCoord.x);

    // Spike profile: thin line that falls off with distance from center
    float spikeWidth = 0.015; // thin spike
    float spikeX = exp(-dX * dX / (2.0 * spikeWidth * spikeWidth));
    float spikeY = exp(-dY * dY / (2.0 * spikeWidth * spikeWidth));

    // Fade spikes toward edges based on spike length
    float radialFade = 1.0 - smoothstep(uSpikeLength * 0.3, uSpikeLength * 0.5, abs(rotCoord.x));
    float radialFadeY = 1.0 - smoothstep(uSpikeLength * 0.3, uSpikeLength * 0.5, abs(rotCoord.y));

    float spike = max(spikeX * radialFadeY, spikeY * radialFade);

    // Scale spike brightness by star brightness (brighter stars = more visible spikes)
    float spikeScale = smoothstep(uSpikeThreshold, uSpikeThreshold + 1.0, vStarSize);
    spike *= uSpikeBrightness * spikeScale;

    alpha = max(alpha, spike);
  }

  alpha *= vBrightness;

  // Discard nearly invisible fragments
  if (alpha < 0.005) discard;

  fragColor = vec4(vColor * vBrightness, alpha);
}
