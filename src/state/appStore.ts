/**
 * Main application state store using Zustand.
 *
 * Manages all skybox generation parameters, camera state,
 * layer visibility, and export settings.
 */

import type { CameraState, ExportFormat, HexColor } from '@/types';
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

/** Point star layer parameters */
export interface StarFieldParams {
  enabled: boolean;
  count: number;
  minBrightness: number;
  maxBrightness: number;
  minSize: number;
  maxSize: number;
  colorVariation: number;
}

/** Nebula layer parameters */
export interface NebulaParams {
  enabled: boolean;
  color1: HexColor;
  color2: HexColor;
  color3: HexColor;
  density: number;
  falloff: number;
  scale: number;
  octaves: number;
  lacunarity: number;
  gain: number;
  offset: [number, number, number];
  brightness: number;
}

/** Constellation overlay parameters */
export interface ConstellationParams {
  enabled: boolean;
  /** Line opacity (0-1) */
  opacity: number;
  /** Line color as hex */
  lineColor: HexColor;
  /** Line width in pixels */
  lineWidth: number;
  /** Set of visible constellation abbreviations (empty = all visible) */
  visibleConstellations: string[];
  /** Show constellation name labels */
  showLabels: boolean;
  /** Label opacity (0-1) */
  labelOpacity: number;
  /** Label color as hex */
  labelColor: HexColor;
  /** Label size multiplier */
  labelScale: number;
}

/** Catalog star layer parameters (real HYG data) */
export interface CatalogStarParams {
  enabled: boolean;
  /** Maximum apparent magnitude to display (higher = more/fainter stars) */
  magnitudeLimit: number;
  /** Overall brightness multiplier */
  brightness: number;
  /** Point size multiplier */
  sizeScale: number;
  /** Blend mode: 'overlay' renders on top, 'replace' hides procedural stars */
  blendMode: 'overlay' | 'replace';
  /** Show named star labels */
  showLabels: boolean;
  /** Named star label opacity */
  labelOpacity: number;
  /** Named star label color */
  labelColor: HexColor;
  /** Named star label size multiplier */
  labelScale: number;
  /** Maximum magnitude for showing labels */
  labelMagnitudeLimit: number;
  /** Enable diffraction spikes on bright stars */
  spikesEnabled: boolean;
  /** Spike length (0-1) */
  spikeLength: number;
  /** Spike brightness (0-2) */
  spikeBrightness: number;
  /** Spike rotation in degrees */
  spikeRotation: number;
  /** Minimum star size for spikes */
  spikeThreshold: number;
  /** Enable seed-based twinkle (brightness variation) */
  twinkleEnabled: boolean;
  /** Twinkle amount (0-1): max brightness reduction */
  twinkleAmount: number;
}

/** Constellation boundary parameters */
export interface ConstellationBoundaryParams {
  enabled: boolean;
  /** Line opacity (0-1) */
  opacity: number;
  /** Line color as hex */
  lineColor: HexColor;
  /** Line width in pixels */
  lineWidth: number;
  /** Dash cycle length (radians on unit sphere) */
  dashLength: number;
  /** Fraction of dash that is visible (0-1) */
  dashRatio: number;
}

/** Milky Way layer parameters */
export interface MilkyWayParams {
  enabled: boolean;
  /** Color at galactic center / bright regions */
  coreColor: HexColor;
  /** Color at edges of the band */
  edgeColor: HexColor;
  /** Overall brightness multiplier */
  brightness: number;
  /** Noise density/intensity */
  density: number;
  /** Width of the band (higher = narrower) */
  width: number;
  /** Noise spatial scale */
  scale: number;
  /** Tilt angle of galactic plane (degrees) */
  tilt: number;
  /** Rotation of galactic plane around Y axis (degrees) */
  rotation: number;
  /** Noise octaves */
  octaves: number;
  /** Noise lacunarity */
  lacunarity: number;
  /** Noise gain */
  gain: number;
  /** 3D offset for panning */
  offset: [number, number, number];
  /** Extra brightness at galactic center */
  coreBrightness: number;
  /** Angular size of core bulge */
  coreSize: number;
}

/** Bloom post-processing parameters */
export interface BloomParams {
  enabled: boolean;
  /** Luminance threshold for bright extraction (0-1) */
  threshold: number;
  /** Soft knee for smooth threshold falloff (0-1) */
  softKnee: number;
  /** Bloom intensity multiplier (0-5) */
  intensity: number;
  /** Number of blur iterations (1-8) */
  iterations: number;
}

/** Sun layer parameters */
export interface SunParams {
  enabled: boolean;
  position: [number, number, number];
  color: HexColor;
  size: number;
  coronaSize: number;
  coronaIntensity: number;
  glowIntensity: number;
  limbDarkening: number;
}

/** Application state */
export interface AppState {
  // ── Global ──
  seed: number;
  faceSize: number;
  backgroundColor: HexColor;

  // ── Camera ──
  camera: CameraState;

  // ── Layer params ──
  starField: StarFieldParams;
  catalogStars: CatalogStarParams;
  constellations: ConstellationParams;
  constellationBoundaries: ConstellationBoundaryParams;
  milkyWay: MilkyWayParams;
  nebula: NebulaParams;
  sun: SunParams;
  bloom: BloomParams;

  // ── Export ──
  exportFormat: ExportFormat;
  exportResolution: number;
  isExporting: boolean;
  exportProgress: number;

  // ── UI state ──
  activePanel: string;
  showPreview: boolean;
  needsRedraw: boolean;

  // ── Actions ──
  setSeed: (seed: number) => void;
  setFaceSize: (size: number) => void;
  setBackgroundColor: (color: HexColor) => void;
  setCamera: (camera: Partial<CameraState>) => void;
  setStarField: (params: Partial<StarFieldParams>) => void;
  setCatalogStars: (params: Partial<CatalogStarParams>) => void;
  setConstellations: (params: Partial<ConstellationParams>) => void;
  setConstellationBoundaries: (params: Partial<ConstellationBoundaryParams>) => void;
  setMilkyWay: (params: Partial<MilkyWayParams>) => void;
  setNebula: (params: Partial<NebulaParams>) => void;
  setSun: (params: Partial<SunParams>) => void;
  setBloom: (params: Partial<BloomParams>) => void;
  setExportFormat: (format: ExportFormat) => void;
  setExportResolution: (resolution: number) => void;
  setIsExporting: (exporting: boolean) => void;
  setExportProgress: (progress: number) => void;
  setActivePanel: (panel: string) => void;
  setShowPreview: (show: boolean) => void;
  requestRedraw: () => void;
  clearRedraw: () => void;
  randomizeSeed: () => void;
  resetToDefaults: () => void;
}

/** Default parameter values */
export const DEFAULT_STAR_FIELD: StarFieldParams = {
  enabled: true,
  count: 100000,
  minBrightness: 0.3,
  maxBrightness: 1.0,
  minSize: 0.4,
  maxSize: 2.0,
  colorVariation: 0.15,
};

export const DEFAULT_NEBULA: NebulaParams = {
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
};

export const DEFAULT_CONSTELLATIONS: ConstellationParams = {
  enabled: false,
  opacity: 0.25,
  lineColor: '#6688cc',
  lineWidth: 0.8,
  visibleConstellations: [],
  showLabels: false,
  labelOpacity: 0.5,
  labelColor: '#8899bb',
  labelScale: 0.7,
};

export const DEFAULT_CONSTELLATION_BOUNDARIES: ConstellationBoundaryParams = {
  enabled: false,
  opacity: 0.15,
  lineColor: '#445588',
  lineWidth: 1.0,
  dashLength: 0.06,
  dashRatio: 0.5,
};

export const DEFAULT_CATALOG_STARS: CatalogStarParams = {
  enabled: true,
  magnitudeLimit: 6.5,
  brightness: 1.0,
  sizeScale: 0.8,
  blendMode: 'overlay',
  showLabels: false,
  labelOpacity: 0.6,
  labelColor: '#ccddee',
  labelScale: 0.6,
  labelMagnitudeLimit: 2.5,
  spikesEnabled: false,
  spikeLength: 0.4,
  spikeBrightness: 0.6,
  spikeRotation: 45,
  spikeThreshold: 3.0,
  twinkleEnabled: false,
  twinkleAmount: 0.4,
};

export const DEFAULT_BLOOM: BloomParams = {
  enabled: false,
  threshold: 0.8,
  softKnee: 0.5,
  intensity: 1.0,
  iterations: 3,
};

export const DEFAULT_SUN: SunParams = {
  enabled: true,
  position: [1, 0.3, 0.5],
  color: '#fff5e0',
  size: 0.015,
  coronaSize: 0.06,
  coronaIntensity: 0.6,
  glowIntensity: 0.35,
  limbDarkening: 0.6,
};

export const DEFAULT_MILKY_WAY: MilkyWayParams = {
  enabled: false,
  coreColor: '#c4b5a0',
  edgeColor: '#3a3550',
  brightness: 0.5,
  density: 1.2,
  width: 4.0,
  scale: 1.5,
  tilt: 62.87,
  rotation: 0,
  octaves: 5,
  lacunarity: 2.0,
  gain: 0.5,
  offset: [0, 0, 0],
  coreBrightness: 0.3,
  coreSize: 0.8,
};

export const useAppStore = create<AppState>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        // ── Global defaults ──
        seed: 42,
        faceSize: 1024,
        backgroundColor: '#000000',

        // ── Camera defaults ──
        camera: {
          yaw: 0,
          pitch: 0,
          fov: 75,
        },

        // ── Layer defaults ──
        starField: DEFAULT_STAR_FIELD,
        catalogStars: DEFAULT_CATALOG_STARS,
        constellations: DEFAULT_CONSTELLATIONS,
        constellationBoundaries: DEFAULT_CONSTELLATION_BOUNDARIES,
        milkyWay: DEFAULT_MILKY_WAY,
        nebula: DEFAULT_NEBULA,
        sun: DEFAULT_SUN,
        bloom: DEFAULT_BLOOM,

        // ── Export defaults ──
        exportFormat: 'png-individual',
        exportResolution: 2048,
        isExporting: false,
        exportProgress: 0,

        // ── UI defaults ──
        activePanel: 'stars',
        showPreview: true,
        needsRedraw: true,

        // ── Actions ──
        setSeed: (seed) => set({ seed, needsRedraw: true }),
        setFaceSize: (faceSize) => set({ faceSize, needsRedraw: true }),
        setBackgroundColor: (backgroundColor) => set({ backgroundColor, needsRedraw: true }),
        setCamera: (camera) => set((state) => ({ camera: { ...state.camera, ...camera } })),
        setStarField: (params) =>
          set((state) => ({
            starField: { ...state.starField, ...params },
            needsRedraw: true,
          })),
        setCatalogStars: (params) =>
          set((state) => ({
            catalogStars: { ...state.catalogStars, ...params },
            needsRedraw: true,
          })),
        setConstellations: (params) =>
          set((state) => ({
            constellations: { ...state.constellations, ...params },
            needsRedraw: true,
          })),
        setConstellationBoundaries: (params) =>
          set((state) => ({
            constellationBoundaries: { ...state.constellationBoundaries, ...params },
            needsRedraw: true,
          })),
        setMilkyWay: (params) =>
          set((state) => ({
            milkyWay: { ...state.milkyWay, ...params },
            needsRedraw: true,
          })),
        setNebula: (params) =>
          set((state) => ({
            nebula: { ...state.nebula, ...params },
            needsRedraw: true,
          })),
        setSun: (params) =>
          set((state) => ({
            sun: { ...state.sun, ...params },
            needsRedraw: true,
          })),
        setBloom: (params) =>
          set((state) => ({
            bloom: { ...state.bloom, ...params },
            needsRedraw: true,
          })),
        setExportFormat: (exportFormat) => set({ exportFormat }),
        setExportResolution: (exportResolution) => set({ exportResolution }),
        setIsExporting: (isExporting) => set({ isExporting }),
        setExportProgress: (exportProgress) => set({ exportProgress }),
        setActivePanel: (activePanel) => set({ activePanel }),
        setShowPreview: (showPreview) => set({ showPreview }),
        requestRedraw: () => set({ needsRedraw: true }),
        clearRedraw: () => set({ needsRedraw: false }),
        randomizeSeed: () =>
          set({ seed: Math.floor(Math.random() * 2147483647), needsRedraw: true }),
        resetToDefaults: () =>
          set({
            seed: 42,
            faceSize: 1024,
            backgroundColor: '#000000',
            camera: { yaw: 0, pitch: 0, fov: 75 },
            starField: { ...DEFAULT_STAR_FIELD },
            catalogStars: { ...DEFAULT_CATALOG_STARS },
            constellations: { ...DEFAULT_CONSTELLATIONS },
            constellationBoundaries: { ...DEFAULT_CONSTELLATION_BOUNDARIES },
            milkyWay: { ...DEFAULT_MILKY_WAY },
            nebula: { ...DEFAULT_NEBULA },
            sun: { ...DEFAULT_SUN },
            bloom: { ...DEFAULT_BLOOM },
            needsRedraw: true,
          }),
      }),
      {
        name: 'skybox-generator-session',
        // Only persist generator parameters, not transient UI/export state
        partialize: (state) => ({
          seed: state.seed,
          faceSize: state.faceSize,
          backgroundColor: state.backgroundColor,
          starField: state.starField,
          catalogStars: state.catalogStars,
          constellations: state.constellations,
          constellationBoundaries: state.constellationBoundaries,
          milkyWay: state.milkyWay,
          nebula: state.nebula,
          sun: state.sun,
          bloom: state.bloom,
          exportFormat: state.exportFormat,
          exportResolution: state.exportResolution,
        }),
      },
    ),
  ),
);
