#version 300 es
precision highp float;

/**
 * milky-way.frag.glsl
 *
 * Procedural Milky Way band shader.
 * Concentrates noise along the galactic plane, creating a
 * realistic band of stars/dust across the sky.
 *
 * The galactic plane is tilted ~62.87° relative to the celestial equator.
 * We rotate the direction vector into galactic coordinates and use
 * the galactic latitude to control intensity falloff.
 */

in vec3 vDirection;

// Galactic plane orientation (rotation angles)
uniform float uTilt;        // Tilt angle of galactic plane (radians)
uniform float uRotation;    // Rotation around vertical axis (radians)

// Appearance
uniform vec3 uCoreColor;    // Color at galactic center
uniform vec3 uEdgeColor;    // Color at edges of the band
uniform float uBrightness;  // Overall brightness multiplier
uniform float uDensity;     // Noise density/intensity
uniform float uWidth;       // Width of the band (falloff sharpness)
uniform float uScale;       // Noise spatial scale
uniform float uSeed;        // Seed for variation
uniform vec3  uOffset;      // 3D offset for panning

// Noise quality
uniform int   uOctaves;
uniform float uLacunarity;
uniform float uGain;

// Core bulge
uniform float uCoreBrightness; // Extra brightness at galactic center
uniform float uCoreSize;       // Angular size of core bulge

out vec4 fragColor;

// ── 4D Simplex Noise (same as nebula) ───────────────────────────

vec4 mod289(vec4 x) { return x - floor(x / 289.0) * 289.0; }
float mod289(float x) { return x - floor(x / 289.0) * 289.0; }
vec4 permute(vec4 x) { return mod289((x * 34.0 + 1.0) * x); }
float permute(float x) { return mod289((x * 34.0 + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float taylorInvSqrt(float r) { return 1.79284291400159 - 0.85373472095314 * r; }

vec4 grad4(float j, vec4 ip) {
  vec4 p;
  p.xyz = floor(fract(vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
  p.w = 1.5 - dot(abs(p.xyz), vec3(1.0));
  vec4 s = vec4(lessThan(p, vec4(0.0)));
  p.xyz = p.xyz + (s.xyz * 2.0 - 1.0) * s.www;
  return p;
}

float snoise(vec4 v) {
  vec4 C = vec4(
    0.138196601125011,
    0.276393202250021,
    0.414589803375032,
   -0.447213595499958
  );
  vec4 i = floor(v + dot(v, vec4(0.309016994374947451)));
  vec4 x0 = v - i + dot(i, C.xxxx);
  vec4 i0;
  vec3 isX = step(x0.yzw, x0.xxx);
  vec3 isYZ = step(x0.zww, x0.yyz);
  i0.x = isX.x + isX.y + isX.z;
  i0.yzw = 1.0 - isX;
  i0.y += isYZ.x + isYZ.y;
  i0.zw += 1.0 - isYZ.xy;
  i0.z += isYZ.z;
  i0.w += 1.0 - isYZ.z;
  vec4 i3 = clamp(i0, 0.0, 1.0);
  vec4 i2 = clamp(i0 - 1.0, 0.0, 1.0);
  vec4 i1 = clamp(i0 - 2.0, 0.0, 1.0);
  vec4 x1 = x0 - i1 + C.xxxx;
  vec4 x2 = x0 - i2 + C.yyyy;
  vec4 x3 = x0 - i3 + C.zzzz;
  vec4 x4 = x0 + C.wwww;
  i = mod289(i);
  float j0 = permute(permute(permute(permute(i.w) + i.z) + i.y) + i.x);
  vec4 j1 = permute(permute(permute(permute(
    i.w + vec4(i1.w, i2.w, i3.w, 1.0))
    + i.z + vec4(i1.z, i2.z, i3.z, 1.0))
    + i.y + vec4(i1.y, i2.y, i3.y, 1.0))
    + i.x + vec4(i1.x, i2.x, i3.x, 1.0));
  vec4 ip = vec4(1.0 / 294.0, 1.0 / 49.0, 1.0 / 7.0, 0.0);
  vec4 p0 = grad4(j0, ip);
  vec4 p1 = grad4(j1.x, ip);
  vec4 p2 = grad4(j1.y, ip);
  vec4 p3 = grad4(j1.z, ip);
  vec4 p4 = grad4(j1.w, ip);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  p4 *= taylorInvSqrt(dot(p4, p4));
  vec3 m0 = max(0.6 - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2)), 0.0);
  vec2 m1 = max(0.6 - vec2(dot(x3, x3), dot(x4, x4)), 0.0);
  m0 = m0 * m0;
  m1 = m1 * m1;
  return 49.0 * (
    dot(m0 * m0, vec3(dot(p0, x0), dot(p1, x1), dot(p2, x2)))
    + dot(m1 * m1, vec2(dot(p3, x3), dot(p4, x4)))
  );
}

// ── FBM ─────────────────────────────────────────────────────────

float fbm(vec4 p, int octaves, float lacunarity, float gain) {
  float value = 0.0;
  float amplitude = 1.0;
  float frequency = 1.0;
  float maxValue = 0.0;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    value += amplitude * snoise(p * frequency);
    maxValue += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }
  return value / maxValue;
}

// ── Rotation helpers ────────────────────────────────────────────

vec3 rotateX(vec3 v, float angle) {
  float c = cos(angle), s = sin(angle);
  return vec3(v.x, c * v.y - s * v.z, s * v.y + c * v.z);
}

vec3 rotateY(vec3 v, float angle) {
  float c = cos(angle), s = sin(angle);
  return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z);
}

void main() {
  vec3 dir = normalize(vDirection);

  // Rotate into galactic coordinates
  vec3 galDir = rotateX(rotateY(dir, uRotation), uTilt);

  // Galactic latitude: how far from the galactic plane
  float galLat = abs(galDir.y);

  // Band envelope: smooth falloff from the galactic plane
  float envelope = exp(-galLat * galLat * uWidth * uWidth);

  // Sample noise along the galactic plane direction
  vec3 noisePos = galDir * uScale + uOffset;
  vec4 p4 = vec4(noisePos, uSeed * 0.1);

  float n = fbm(p4, uOctaves, uLacunarity, uGain);
  n = n * 0.5 + 0.5; // remap to [0,1]

  // Add fine detail layer with higher frequency
  float detail = fbm(p4 * 3.0 + vec4(100.0), uOctaves - 2 > 0 ? uOctaves - 2 : 1, uLacunarity, uGain);
  detail = detail * 0.5 + 0.5;
  n = mix(n, n * detail, 0.4);

  // Modulate by envelope
  float intensity = n * envelope * uDensity;

  // Core bulge — extra brightness toward galactic center
  // Galactic center is approximately at (galDir.x > 0, galDir.y ≈ 0)
  float coreAngle = length(vec2(atan(galDir.z, galDir.x), galDir.y));
  float coreFactor = exp(-coreAngle * coreAngle / (uCoreSize * uCoreSize));
  intensity += coreFactor * uCoreBrightness * envelope;

  intensity = clamp(intensity, 0.0, 1.0);

  // Color: blend from edge to core based on intensity
  vec3 color = mix(uEdgeColor, uCoreColor, intensity);
  color *= uBrightness;

  fragColor = vec4(color, intensity);
}
