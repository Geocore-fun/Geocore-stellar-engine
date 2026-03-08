/**
 * Skybox preset system.
 *
 * Provides built-in presets, localStorage persistence,
 * and import/export as JSON files.
 */

import {
  DEFAULT_CATALOG_STARS,
  DEFAULT_CONSTELLATIONS,
  DEFAULT_NEBULA,
  DEFAULT_STAR_FIELD,
  DEFAULT_SUN,
  type CatalogStarParams,
  type ConstellationParams,
  type NebulaParams,
  type StarFieldParams,
  type SunParams,
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
}

export interface Preset {
  id: string;
  name: string;
  builtIn: boolean;
  data: PresetData;
}

// ── Built-in presets ────────────────────────────────────────────

const DEFAULT: Preset = {
  id: 'default',
  name: 'Default',
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
  },
};

const DEEP_SPACE: Preset = {
  id: 'deep-space',
  name: 'Deep Space',
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
  },
};

const SUNSET_NEBULA: Preset = {
  id: 'sunset-nebula',
  name: 'Sunset Nebula',
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

export const BUILT_IN_PRESETS: Preset[] = [
  DEFAULT,
  DEEP_SPACE,
  MILKY_WAY,
  SUNSET_NEBULA,
  BLUE_GIANT,
  VOID,
];

// ── localStorage helpers ────────────────────────────────────────

const STORAGE_KEY = 'skybox-generator-presets';

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
