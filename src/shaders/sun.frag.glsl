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

  // ── Solar disk ──
  float diskEdge = smoothstep(uSunSize, uSunSize * 0.95, angle);

  // Limb darkening (edges of disk are dimmer)
  float mu = cos(angle / uSunSize * 3.14159 * 0.5);
  float limb = mix(1.0, pow(max(mu, 0.0), 0.5), uLimbDarkening);
  float disk = diskEdge * limb;

  // ── Corona ──
  float coronaAngle = angle - uSunSize;
  float corona = 0.0;
  if (coronaAngle > 0.0 && coronaAngle < uCoronaSize) {
    corona = pow(1.0 - coronaAngle / uCoronaSize, 3.0) * uCoronaIntensity;
  }

  // ── Glow (wide atmospheric halo) ──
  float glow = pow(max(cosAngle, 0.0), 256.0) * uGlowIntensity;
  glow += pow(max(cosAngle, 0.0), 32.0) * uGlowIntensity * 0.3;

  // ── Combine ──
  float intensity = disk + corona + glow;
  vec3 color = uSunColor * intensity;

  fragColor = vec4(color, clamp(intensity, 0.0, 1.0));
}
