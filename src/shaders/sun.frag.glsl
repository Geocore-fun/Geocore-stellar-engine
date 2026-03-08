#version 300 es
precision highp float;

// Sun fragment shader.
// Renders a photorealistic sun with disk, corona, and glow.

in vec3 vDirection;

uniform vec3 uSunDirection;
uniform vec3 uSunColor;
uniform float uSunSize;
uniform float uCoronaSize;
uniform float uCoronaIntensity;
uniform float uGlowIntensity;
uniform float uLimbDarkening;

out vec4 fragColor;

void main() {
  vec3 dir = normalize(vDirection);
  float cosAngle = dot(dir, normalize(uSunDirection));
  float angle = acos(clamp(cosAngle, -1.0, 1.0));

  // Normalized radial position: 0 at center, 1 at disk edge
  float r = angle / uSunSize;

  // ── Solar disk ──
  // Soft edge with wider smoothstep to avoid hard cutoff
  float diskEdge = smoothstep(1.05, 0.9, r);

  // Limb darkening: physically-based Eddington approximation
  // mu = cos(theta) where theta is angle from disk center
  // Clamp mu so it never fully reaches zero — preserves brightness at limb
  float mu = sqrt(max(1.0 - r * r, 0.0));
  // Quintic limb darkening coefficients (solar-like):
  // I(mu)/I(1) = 1 - u*(1 - mu^0.5)
  float limb = 1.0 - uLimbDarkening * (1.0 - pow(max(mu, 0.05), 0.5));
  float disk = diskEdge * limb;

  // ── Corona ──
  // Start overlapping with the disk edge for seamless transition
  float coronaDist = max(r - 0.85, 0.0);
  float coronaWidth = uCoronaSize / uSunSize;
  float corona = 0.0;
  if (coronaDist < coronaWidth) {
    float t = coronaDist / coronaWidth;
    // Power-law falloff — brighter near the limb, fades smoothly
    corona = pow(1.0 - t, 2.5) * uCoronaIntensity;
    // Fade in the corona so it doesn't add brightness inside the disk
    corona *= smoothstep(0.85, 1.05, r);
  }

  // ── Glow (wide atmospheric halo) ──
  float glow = pow(max(cosAngle, 0.0), 256.0) * uGlowIntensity;
  glow += pow(max(cosAngle, 0.0), 32.0) * uGlowIntensity * 0.3;

  // ── Combine ──
  float intensity = disk + corona + glow;
  vec3 color = uSunColor * intensity;

  fragColor = vec4(color, clamp(intensity, 0.0, 1.0));
}
