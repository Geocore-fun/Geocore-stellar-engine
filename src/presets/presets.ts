/**
 * Skybox preset system.
 *
 * Provides built-in presets, localStorage persistence,
 * and import/export as JSON files.
 */

import {
  DEFAULT_BLOOM,
  DEFAULT_CATALOG_STARS,
  DEFAULT_CONSTELLATION_BOUNDARIES,
  DEFAULT_CONSTELLATIONS,
  DEFAULT_GOD_RAYS,
  DEFAULT_LENS_FLARE,
  DEFAULT_MILKY_WAY,
  DEFAULT_NEBULA,
  DEFAULT_STAR_FIELD,
  DEFAULT_SUN,
  type BloomParams,
  type CatalogStarParams,
  type ConstellationBoundaryParams,
  type ConstellationParams,
  type GodRayParams,
  type LensFlareParams,
  type MilkyWayParams,
  type NebulaParams,
  type SceneParams,
  type StarFieldParams,
  type SunParams,
  useAppStore,
} from '@/state/appStore';
import type { HexColor } from '@/types';

/** A snapshot of all generator parameters (no UI / camera / export state). */
export interface PresetData {
  seed: number;
  faceSize: number;
  backgroundColor: HexColor;
  starField: StarFieldParams;
  nebula: NebulaParams;
  sun: SunParams;
  catalogStars?: CatalogStarParams;
  constellations?: ConstellationParams;
  constellationBoundaries?: ConstellationBoundaryParams;
  milkyWay?: MilkyWayParams;
  bloom?: BloomParams;
  lensFlare?: LensFlareParams;
  godRays?: GodRayParams;
}

export interface Preset {
  id: string;
  name: string;
  /** One line on what the preset looks like and what it suits. */
  description?: string;
  builtIn: boolean;
  data: PresetData;
}

// ── Resolving and applying ──────────────────────────────────────

/** Preview face sizes the toolbar offers; anything else in a file falls back. */
const PREVIEW_FACE_SIZES = [256, 512, 1024, 2048, 4096];

/**
 * Turn possibly-partial preset data into a complete scene.
 *
 * Every section is merged over its defaults, so a preset saved before a field
 * existed (or one that omits a whole layer) loads the same way every time
 * instead of inheriting whatever the previous preset left behind. Numbers that
 * would hurt the GPU when they come from an imported file are reined in.
 */
export function resolvePresetData(data: PresetData): SceneParams {
  return {
    seed: Number.isFinite(data.seed) ? Math.trunc(data.seed) : 42,
    faceSize: PREVIEW_FACE_SIZES.includes(data.faceSize) ? data.faceSize : 1024,
    backgroundColor: data.backgroundColor ?? '#000000',
    starField: { ...DEFAULT_STAR_FIELD, ...data.starField },
    nebula: { ...DEFAULT_NEBULA, ...data.nebula },
    sun: { ...DEFAULT_SUN, ...data.sun },
    catalogStars: { ...DEFAULT_CATALOG_STARS, ...data.catalogStars },
    constellations: { ...DEFAULT_CONSTELLATIONS, ...data.constellations },
    constellationBoundaries: {
      ...DEFAULT_CONSTELLATION_BOUNDARIES,
      ...data.constellationBoundaries,
    },
    milkyWay: { ...DEFAULT_MILKY_WAY, ...data.milkyWay },
    bloom: { ...DEFAULT_BLOOM, ...data.bloom },
    lensFlare: { ...DEFAULT_LENS_FLARE, ...data.lensFlare },
    godRays: { ...DEFAULT_GOD_RAYS, ...data.godRays },
  };
}

/** Load a preset into the app as one state change (one undo step, one redraw). */
export function applyPresetData(data: PresetData): void {
  useAppStore.setState({ ...resolvePresetData(data), needsRedraw: true });
}

/** Overrides for {@link scene}: each layer section may name only what differs. */
type SceneOverrides = { backgroundColor?: HexColor } & {
  [K in Exclude<keyof SceneParams, 'seed' | 'faceSize' | 'backgroundColor'>]?: Partial<
    SceneParams[K]
  >;
};

/** Build a complete built-in preset from the defaults plus what differs. */
function scene(seed: number, overrides: SceneOverrides): PresetData {
  return resolvePresetData({
    seed,
    faceSize: 1024,
    backgroundColor: overrides.backgroundColor ?? '#000000',
    starField: { ...DEFAULT_STAR_FIELD, ...overrides.starField },
    nebula: { ...DEFAULT_NEBULA, ...overrides.nebula },
    sun: { ...DEFAULT_SUN, ...overrides.sun },
    catalogStars: { ...DEFAULT_CATALOG_STARS, ...overrides.catalogStars },
    constellations: { ...DEFAULT_CONSTELLATIONS, ...overrides.constellations },
    constellationBoundaries: {
      ...DEFAULT_CONSTELLATION_BOUNDARIES,
      ...overrides.constellationBoundaries,
    },
    milkyWay: { ...DEFAULT_MILKY_WAY, ...overrides.milkyWay },
    bloom: { ...DEFAULT_BLOOM, ...overrides.bloom },
    lensFlare: { ...DEFAULT_LENS_FLARE, ...overrides.lensFlare },
    godRays: { ...DEFAULT_GOD_RAYS, ...overrides.godRays },
  });
}

// ── Built-in presets ────────────────────────────────────────────

const DEFAULT: Preset = {
  id: 'default',
  name: 'Default',
  description:
    'The starting sky: real and procedural stars over a faint violet haze, with a soft sun.',
  builtIn: true,
  data: {
    seed: 42,
    faceSize: 1024,
    backgroundColor: '#000000',
    starField: { ...DEFAULT_STAR_FIELD },
    nebula: { ...DEFAULT_NEBULA },
    sun: { ...DEFAULT_SUN },
    catalogStars: { ...DEFAULT_CATALOG_STARS },
    constellations: { ...DEFAULT_CONSTELLATIONS },
    constellationBoundaries: { ...DEFAULT_CONSTELLATION_BOUNDARIES },
    milkyWay: { ...DEFAULT_MILKY_WAY },
    bloom: { ...DEFAULT_BLOOM },
    lensFlare: { ...DEFAULT_LENS_FLARE },
    godRays: { ...DEFAULT_GOD_RAYS },
  },
};

const DEEP_SPACE: Preset = {
  id: 'deep-space',
  name: 'Deep Space',
  description: 'Dense starfield over a dim violet nebula, with a slightly larger sun.',
  builtIn: true,
  data: {
    seed: 42,
    faceSize: 1024,
    backgroundColor: '#000000',
    starField: {
      enabled: true,
      count: 100000,
      minBrightness: 0.3,
      maxBrightness: 1.0,
      minSize: 0.5,
      maxSize: 2.5,
      colorVariation: 0.15,
    },
    nebula: {
      enabled: true,
      color1: '#1a0533',
      color2: '#0a1628',
      color3: '#120a28',
      density: 0.5,
      falloff: 2.0,
      scale: 1.0,
      octaves: 6,
      lacunarity: 2.0,
      gain: 0.5,
      offset: [0, 0, 0],
      brightness: 0.6,
    },
    sun: {
      enabled: true,
      position: [1, 0.3, 0.5],
      color: '#fff5e0',
      size: 0.02,
      coronaSize: 0.08,
      coronaIntensity: 0.7,
      glowIntensity: 0.4,
      limbDarkening: 0.6,
    },
  },
};

const MILKY_WAY: Preset = {
  id: 'milky-way',
  name: 'Milky Way',
  description: 'A quarter-million stars with the galactic band and its warm core across the sky.',
  builtIn: true,
  data: {
    seed: 7891,
    faceSize: 1024,
    backgroundColor: '#020208',
    starField: {
      enabled: true,
      count: 250000,
      minBrightness: 0.15,
      maxBrightness: 1.0,
      minSize: 0.3,
      maxSize: 2.0,
      colorVariation: 0.25,
    },
    nebula: {
      enabled: true,
      color1: '#1c1040',
      color2: '#0d1a33',
      color3: '#251545',
      density: 0.8,
      falloff: 1.5,
      scale: 0.8,
      octaves: 7,
      lacunarity: 2.2,
      gain: 0.45,
      offset: [0, 0, 0],
      brightness: 0.45,
    },
    sun: {
      enabled: true,
      position: [0.6, 0.1, -0.8],
      color: '#fffbe8',
      size: 0.015,
      coronaSize: 0.06,
      coronaIntensity: 0.5,
      glowIntensity: 0.3,
      limbDarkening: 0.5,
    },
    // Before the Milky Way layer existed this preset relied on nebula alone;
    // it now shows the band its name promises.
    milkyWay: {
      ...DEFAULT_MILKY_WAY,
      enabled: true,
      brightness: 0.6,
      density: 1.3,
      coreBrightness: 0.4,
    },
  },
};

const SUNSET_NEBULA: Preset = {
  id: 'sunset-nebula',
  name: 'Sunset Nebula',
  description: 'Wine and amber nebula lit by a big golden sun.',
  builtIn: true,
  data: {
    seed: 3456,
    faceSize: 1024,
    backgroundColor: '#050005',
    starField: {
      enabled: true,
      count: 80000,
      minBrightness: 0.2,
      maxBrightness: 0.9,
      minSize: 0.4,
      maxSize: 2.0,
      colorVariation: 0.1,
    },
    nebula: {
      enabled: true,
      color1: '#4a0e1e',
      color2: '#2d1a05',
      color3: '#1a0833',
      density: 0.7,
      falloff: 1.8,
      scale: 1.2,
      octaves: 5,
      lacunarity: 2.1,
      gain: 0.55,
      offset: [0, 0, 0],
      brightness: 0.8,
    },
    sun: {
      enabled: true,
      position: [-0.5, 0.6, 0.3],
      color: '#ffcc88',
      size: 0.03,
      coronaSize: 0.12,
      coronaIntensity: 1.0,
      glowIntensity: 0.6,
      limbDarkening: 0.4,
    },
  },
};

const VOID: Preset = {
  id: 'void',
  name: 'Void',
  description: 'Almost nothing: a sparse scatter of faint stars on pure black.',
  builtIn: true,
  data: {
    seed: 1,
    faceSize: 1024,
    backgroundColor: '#000000',
    starField: {
      enabled: true,
      count: 30000,
      minBrightness: 0.1,
      maxBrightness: 0.6,
      minSize: 0.3,
      maxSize: 1.5,
      colorVariation: 0.05,
    },
    nebula: {
      enabled: false,
      color1: '#000000',
      color2: '#000000',
      color3: '#000000',
      density: 0,
      falloff: 2.0,
      scale: 1.0,
      octaves: 4,
      lacunarity: 2.0,
      gain: 0.5,
      offset: [0, 0, 0],
      brightness: 0,
    },
    sun: {
      enabled: false,
      position: [1, 0, 0],
      color: '#ffffff',
      size: 0.02,
      coronaSize: 0.08,
      coronaIntensity: 0.7,
      glowIntensity: 0.4,
      limbDarkening: 0.6,
    },
  },
};

const BLUE_GIANT: Preset = {
  id: 'blue-giant',
  name: 'Blue Giant',
  description: 'Cold blue haze around a large blue-white star.',
  builtIn: true,
  data: {
    seed: 5555,
    faceSize: 1024,
    backgroundColor: '#000308',
    starField: {
      enabled: true,
      count: 150000,
      minBrightness: 0.2,
      maxBrightness: 1.0,
      minSize: 0.4,
      maxSize: 2.2,
      colorVariation: 0.3,
    },
    nebula: {
      enabled: true,
      color1: '#081830',
      color2: '#051228',
      color3: '#0a2040',
      density: 0.4,
      falloff: 2.2,
      scale: 1.5,
      octaves: 5,
      lacunarity: 1.9,
      gain: 0.48,
      offset: [0, 0, 0],
      brightness: 0.55,
    },
    sun: {
      enabled: true,
      position: [0.3, 0.8, -0.2],
      color: '#cce0ff',
      size: 0.04,
      coronaSize: 0.15,
      coronaIntensity: 1.2,
      glowIntensity: 0.7,
      limbDarkening: 0.3,
    },
  },
};

// ── Orbit backdrops for Geocore ─────────────────────────────────
//
// Tuned to sit behind a lit globe seen from low orbit: the globe is the
// subject, so the sky stays darker than the planet's night side and nothing
// bright fills large areas behind country labels. Each is complete (every
// layer stated), so loading one never inherits the previous preset's layers.

const ORBIT_CLEAN: Preset = {
  id: 'orbit-clean',
  name: 'Orbit Clean',
  description: 'Real stars on pure black and nothing else. The safest, most readable backdrop.',
  builtIn: true,
  data: scene(2024, {
    // Faint procedural fill so the sky is not patchy between catalogue stars.
    starField: { count: 40000, minBrightness: 0.12, maxBrightness: 0.55, maxSize: 1.4 },
    catalogStars: { magnitudeLimit: 6.2, brightness: 0.95, sizeScale: 0.8 },
    nebula: { enabled: false },
    sun: { enabled: false },
  }),
};

const QUIET_ORBIT: Preset = {
  id: 'quiet-orbit',
  name: 'Quiet Orbit',
  description: 'Very dark navy with only the brighter stars. Minimal, for maximum label contrast.',
  builtIn: true,
  data: scene(77, {
    backgroundColor: '#02030a',
    starField: { enabled: false },
    // Magnitude 5 keeps the constellations recognisable with a fraction of the stars.
    catalogStars: { magnitudeLimit: 5.0, brightness: 0.7, sizeScale: 0.75 },
    nebula: {
      color1: '#02030a',
      color2: '#06102a',
      color3: '#0c1a3a',
      density: 0.45,
      falloff: 2.4,
      scale: 0.8,
      octaves: 5,
      brightness: 0.35,
    },
    sun: { enabled: false },
  }),
};

const GALACTIC_CORE: Preset = {
  id: 'galactic-core',
  name: 'Galactic Core',
  description:
    'The Milky Way at its real tilt with a bright, dusty core; stars over black elsewhere.',
  builtIn: true,
  data: scene(1987, {
    starField: { count: 120000, minBrightness: 0.15, maxBrightness: 0.85, colorVariation: 0.2 },
    catalogStars: { magnitudeLimit: 6.5, brightness: 1.0 },
    // No nebula: the band carries the colour, and black around it keeps contrast.
    nebula: { enabled: false },
    milkyWay: {
      enabled: true,
      coreColor: '#e8d2b0',
      edgeColor: '#2a2440',
      brightness: 0.75,
      density: 1.35,
      width: 4.5,
      scale: 1.6,
      octaves: 6,
      coreBrightness: 0.55,
      coreSize: 0.7,
    },
    sun: { enabled: false },
  }),
};

const ORBITAL_SUNRISE: Preset = {
  id: 'orbital-sunrise',
  name: 'Orbital Sunrise',
  description: 'A warm sun low on the horizon with bloom, soft rays and a faint flare.',
  builtIn: true,
  data: scene(606, {
    backgroundColor: '#010104',
    // Daylight in orbit washes out the faint stars, so only the bright ones remain.
    starField: { count: 30000, minBrightness: 0.08, maxBrightness: 0.45, maxSize: 1.5 },
    catalogStars: { magnitudeLimit: 4.5, brightness: 0.8 },
    nebula: {
      color1: '#020308',
      color2: '#141028',
      color3: '#4a2a18',
      density: 0.5,
      falloff: 2.2,
      scale: 0.9,
      octaves: 5,
      brightness: 0.4,
    },
    // Low over the equatorial plane, where an orbiting camera meets it at the limb.
    sun: {
      position: [1, 0.08, 0.35],
      color: '#ffe4b8',
      size: 0.022,
      coronaSize: 0.11,
      coronaIntensity: 1.0,
      glowIntensity: 0.65,
      limbDarkening: 0.5,
    },
    bloom: { enabled: true, threshold: 0.75, softKnee: 0.6, intensity: 0.8, iterations: 4 },
    godRays: { enabled: true, exposure: 0.22, decay: 0.955, density: 0.75, weight: 0.45 },
    lensFlare: { enabled: true, intensity: 0.15, haloIntensity: 0.12, chromaticAberration: 0.4 },
  }),
};

const HIGH_CONTRAST: Preset = {
  id: 'high-contrast',
  name: 'High Contrast',
  description: 'Crisp, bright stars with diffraction spikes on the brightest, over pure black.',
  builtIn: true,
  data: scene(31337, {
    starField: {
      count: 140000,
      minBrightness: 0.3,
      maxBrightness: 1.0,
      maxSize: 2.2,
      colorVariation: 0.3,
    },
    catalogStars: {
      magnitudeLimit: 7.0,
      brightness: 1.3,
      sizeScale: 1.0,
      // Spikes only on the very brightest so they read as highlights, not noise.
      spikesEnabled: true,
      spikeLength: 0.35,
      spikeBrightness: 0.55,
      spikeThreshold: 3.2,
    },
    nebula: { enabled: false },
    sun: { enabled: false },
  }),
};

const CONSTELLATION_ATLAS: Preset = {
  id: 'constellation-atlas',
  name: 'Constellation Atlas',
  description:
    'Real stars joined by faint constellation lines, to learn the sky alongside the map.',
  builtIn: true,
  data: scene(88, {
    starField: { count: 30000, minBrightness: 0.1, maxBrightness: 0.5, maxSize: 1.4 },
    catalogStars: { magnitudeLimit: 6.0, brightness: 1.05 },
    nebula: { enabled: false },
    sun: { enabled: false },
    // Low opacity: the lines guide the eye without competing with the globe.
    // Names stay off: the label layer draws them rotated 180° in the preview,
    // and lines read correctly at any orientation (see docs/features.md).
    constellations: {
      enabled: true,
      opacity: 0.3,
      lineColor: '#6f8fd0',
      lineWidth: 0.9,
      showLabels: false,
    },
  }),
};

// The nebula shader blends color1 -> color2 below n = 0.5 and color2 -> color3
// above it, where n = fbm^falloff * density. Typical fbm sits around 0.3-0.7, so
// with density below ~1 the third colour is almost never reached. The colourful
// presets push density to 1.35-1.6 so their accent colour actually shows.
const AURORA_DRIFT: Preset = {
  id: 'aurora-drift',
  name: 'Aurora Drift',
  description: 'Teal and violet clouds drifting through a dark starfield.',
  builtIn: true,
  data: scene(4242, {
    backgroundColor: '#010307',
    starField: { count: 90000, minBrightness: 0.2, maxBrightness: 0.9 },
    catalogStars: { magnitudeLimit: 6.0 },
    nebula: {
      color1: '#020a10',
      color2: '#0d4a4a',
      color3: '#5a2c8c',
      density: 1.5,
      falloff: 1.8,
      scale: 1.3,
      octaves: 6,
      lacunarity: 2.1,
      gain: 0.5,
      brightness: 0.75,
    },
    sun: { enabled: false },
  }),
};

const CRIMSON_RIFT: Preset = {
  id: 'crimson-rift',
  name: 'Crimson Rift',
  description: 'Deep red and ember-orange gas with a dim Milky Way behind it.',
  builtIn: true,
  data: scene(1312, {
    backgroundColor: '#040103',
    starField: { count: 80000, minBrightness: 0.18, maxBrightness: 0.85 },
    catalogStars: { magnitudeLimit: 5.8 },
    // A higher falloff gathers the colour into ridges and leaves dark gaps.
    nebula: {
      color1: '#0c0206',
      color2: '#5a0f26',
      color3: '#c8582e',
      density: 1.6,
      falloff: 2.3,
      scale: 1.1,
      octaves: 6,
      lacunarity: 2.2,
      gain: 0.52,
      brightness: 0.7,
    },
    milkyWay: {
      enabled: true,
      coreColor: '#d8b8a0',
      edgeColor: '#2a1020',
      brightness: 0.35,
      density: 1.1,
      coreBrightness: 0.2,
    },
    sun: { enabled: false },
  }),
};

const COBALT_DREAM: Preset = {
  id: 'cobalt-dream',
  name: 'Cobalt Dream',
  description: 'Ink-blue to bright cyan nebula with a small cool-white sun.',
  builtIn: true,
  data: scene(9001, {
    backgroundColor: '#000207',
    starField: { count: 100000, minBrightness: 0.2, maxBrightness: 0.95, colorVariation: 0.25 },
    catalogStars: { magnitudeLimit: 6.0 },
    nebula: {
      color1: '#01040e',
      color2: '#0b2766',
      color3: '#3a9ad0',
      density: 1.5,
      falloff: 2.0,
      scale: 1.2,
      octaves: 6,
      brightness: 0.65,
    },
    sun: {
      position: [-0.6, 0.45, -0.65],
      color: '#e8f2ff',
      size: 0.012,
      coronaSize: 0.06,
      coronaIntensity: 0.7,
      glowIntensity: 0.4,
    },
  }),
};

const NEBULA_VEIL: Preset = {
  id: 'nebula-veil',
  name: 'Nebula Veil',
  description: 'A rich full-sky nebula in plum, rose and gold. The most colourful look.',
  builtIn: true,
  data: scene(2718, {
    backgroundColor: '#030106',
    starField: { count: 120000, minBrightness: 0.2, maxBrightness: 1.0 },
    catalogStars: { magnitudeLimit: 6.0 },
    nebula: {
      color1: '#0a0314',
      color2: '#4a1a5a',
      color3: '#d08a5a',
      density: 1.35,
      falloff: 1.6,
      scale: 1.0,
      octaves: 7,
      lacunarity: 2.1,
      gain: 0.55,
      brightness: 0.85,
    },
    sun: { enabled: false },
    bloom: { enabled: true, threshold: 0.85, softKnee: 0.5, intensity: 0.5, iterations: 3 },
  }),
};

/**
 * Built-in presets. The first nine are bound to the 1-9 keys, so append new
 * presets rather than reordering.
 */
export const BUILT_IN_PRESETS: Preset[] = [
  DEFAULT,
  DEEP_SPACE,
  MILKY_WAY,
  SUNSET_NEBULA,
  BLUE_GIANT,
  VOID,
  ORBIT_CLEAN,
  QUIET_ORBIT,
  GALACTIC_CORE,
  ORBITAL_SUNRISE,
  HIGH_CONTRAST,
  CONSTELLATION_ATLAS,
  AURORA_DRIFT,
  CRIMSON_RIFT,
  COBALT_DREAM,
  NEBULA_VEIL,
];

// ── localStorage helpers ────────────────────────────────────────

const STORAGE_KEY = 'geocore-stellar-engine-presets';

/** Load user-saved presets from localStorage. */
export function loadUserPresets(): Preset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Preset[];
  } catch {
    return [];
  }
}

/** Save user presets to localStorage. */
export function saveUserPresets(presets: Preset[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

/** Get all presets (built-in + user). */
export function getAllPresets(): Preset[] {
  return [...BUILT_IN_PRESETS, ...loadUserPresets()];
}

/** Save current parameters as a new user preset. */
export function saveAsPreset(name: string, data: PresetData): Preset {
  const preset: Preset = {
    id: `user-${Date.now()}`,
    name,
    builtIn: false,
    data: structuredClone(data),
  };
  const userPresets = loadUserPresets();
  userPresets.push(preset);
  saveUserPresets(userPresets);
  return preset;
}

/** Delete a user preset by ID. */
export function deleteUserPreset(id: string): void {
  const userPresets = loadUserPresets().filter((p) => p.id !== id);
  saveUserPresets(userPresets);
}

// ── JSON import/export ──────────────────────────────────────────

/** Export a preset as a downloadable JSON file. */
export function exportPresetAsJson(preset: Preset): void {
  const json = JSON.stringify(preset, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${preset.name.replace(/\s+/g, '-').toLowerCase()}.skybox.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Import a preset from a JSON file. Returns null if invalid. */
export function importPresetFromJson(file: File): Promise<Preset | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const preset = JSON.parse(reader.result as string) as Preset;
        // Basic validation
        if (!preset.name || !preset.data || !preset.data.starField) {
          resolve(null);
          return;
        }
        // Force a new ID so it doesn't collide
        preset.id = `imported-${Date.now()}`;
        preset.builtIn = false;
        resolve(preset);
      } catch {
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
}
