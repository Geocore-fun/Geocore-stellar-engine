/**
 * loadCatalog.ts — fetches and parses the pre-processed binary star catalog
 * produced by scripts/preprocess-hyg.mjs.
 *
 * Binary format (little-endian):
 *   Header (8 bytes): uint32 magic (0x48594753) + uint32 count
 *   Per star (20 bytes): float32 rarad, float32 decrad, float32 mag, float32 ci, uint32 hip
 */

/** A single catalog star entry */
export interface CatalogStar {
  /** Right ascension in radians [0, 2π) */
  rarad: number;
  /** Declination in radians [-π/2, π/2] */
  decrad: number;
  /** Apparent visual magnitude (lower = brighter) */
  mag: number;
  /** B-V color index */
  ci: number;
  /** Hipparcos catalog ID (0 if none) */
  hip: number;
  /** Unit-sphere position (computed from RA/Dec) */
  x: number;
  y: number;
  z: number;
}

/** A named star entry (from JSON) */
export interface NamedStar {
  name: string;
  bayer: string;
  con: string;
  hip: number;
  ra: number;
  dec: number;
  rarad: number;
  decrad: number;
  mag: number;
  ci: number;
}

const MAGIC = 0x48594753;
const HEADER_SIZE = 8;
const STAR_SIZE = 20;
const SPHERE_RADIUS = 50; // Match PointStarLayer radius

/**
 * Convert RA/Dec (radians) to Cartesian coordinates on a sphere.
 * RA increases eastward (counterclockwise from above).
 * Dec ranges from -π/2 (south) to +π/2 (north).
 */
function raDec2Xyz(rarad: number, decrad: number, radius: number): [number, number, number] {
  const cosDec = Math.cos(decrad);
  const x = radius * cosDec * Math.cos(rarad);
  const y = radius * Math.sin(decrad);
  const z = radius * cosDec * Math.sin(rarad);
  return [x, y, z];
}

/**
 * Load and parse the binary star catalog.
 * Returns an array sorted brightest-first.
 */
export async function loadCatalog(url = '/data/stars.bin'): Promise<CatalogStar[]> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to load star catalog: ${resp.status}`);

  const buf = await resp.arrayBuffer();
  const view = new DataView(buf);

  const magic = view.getUint32(0, true);
  if (magic !== MAGIC) {
    throw new Error(`Invalid star catalog magic: 0x${magic.toString(16)}`);
  }

  const count = view.getUint32(4, true);
  const stars: CatalogStar[] = new Array(count);

  for (let i = 0; i < count; i++) {
    const off = HEADER_SIZE + i * STAR_SIZE;
    const rarad = view.getFloat32(off, true);
    const decrad = view.getFloat32(off + 4, true);
    const mag = view.getFloat32(off + 8, true);
    const ci = view.getFloat32(off + 12, true);
    const hip = view.getUint32(off + 16, true);

    const [x, y, z] = raDec2Xyz(rarad, decrad, SPHERE_RADIUS);
    stars[i] = { rarad, decrad, mag, ci, hip, x, y, z };
  }

  return stars;
}

/**
 * Convert catalog data to a GPU-ready Float32Array.
 * Layout per star (7 floats): position (vec3) + size (float) + color (vec3)
 *
 * @param stars     Full catalog array
 * @param magLimit  Only include stars brighter than this magnitude
 * @param sizeScale Multiplier for star sizes
 * @param colorFn   Function converting B-V color index to RGB [r, g, b]
 */
export function buildCatalogVertexData(
  stars: CatalogStar[],
  magLimit: number,
  sizeScale: number,
  colorFn: (ci: number) => [number, number, number],
): { data: Float32Array; count: number } {
  // Pre-filter to count
  const filtered = stars.filter((s) => s.mag <= magLimit);
  const count = filtered.length;
  const data = new Float32Array(count * 7);

  for (let i = 0; i < count; i++) {
    const s = filtered[i];
    const off = i * 7;

    // Position
    data[off + 0] = s.x;
    data[off + 1] = s.y;
    data[off + 2] = s.z;

    // Size — logarithmic mapping from magnitude
    // Brightest stars (mag ~ -1.5) → largest, faintest (mag ~ 7) → smallest
    // We map mag range [-1.5, magLimit] → size range [maxPtSize, minPtSize]
    const magMin = -1.5;
    const magRange = magLimit - magMin;
    const t = 1.0 - (s.mag - magMin) / magRange; // 1 = brightest, 0 = faintest
    const size = (0.4 + t * t * 3.5) * sizeScale;
    data[off + 3] = size;

    // Color from B-V
    const [r, g, b] = colorFn(s.ci);
    data[off + 4] = r;
    data[off + 5] = g;
    data[off + 6] = b;
  }

  return { data, count };
}

/**
 * Load named stars JSON.
 */
export async function loadNamedStars(url = '/data/named-stars.json'): Promise<NamedStar[]> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to load named stars: ${resp.status}`);
  return resp.json();
}
