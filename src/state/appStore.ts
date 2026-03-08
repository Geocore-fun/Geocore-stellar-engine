/**
 * Main application state store using Zustand.
 *
 * Manages all skybox generation parameters, camera state,
 * layer visibility, and export settings.
 */

import type { CameraState, ExportFormat, HexColor } from '@/types';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

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
  nebula: NebulaParams;
  sun: SunParams;

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
  setNebula: (params: Partial<NebulaParams>) => void;
  setSun: (params: Partial<SunParams>) => void;
  setExportFormat: (format: ExportFormat) => void;
  setExportResolution: (resolution: number) => void;
  setIsExporting: (exporting: boolean) => void;
  setExportProgress: (progress: number) => void;
  setActivePanel: (panel: string) => void;
  setShowPreview: (show: boolean) => void;
  requestRedraw: () => void;
  clearRedraw: () => void;
  randomizeSeed: () => void;
}

/** Default parameter values */
const DEFAULT_STAR_FIELD: StarFieldParams = {
  enabled: true,
  count: 100000,
  minBrightness: 0.3,
  maxBrightness: 1.0,
  minSize: 0.5,
  maxSize: 2.5,
  colorVariation: 0.15,
};

const DEFAULT_NEBULA: NebulaParams = {
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

const DEFAULT_SUN: SunParams = {
  enabled: true,
  position: [1, 0.3, 0.5],
  color: '#fff5e0',
  size: 0.02,
  coronaSize: 0.08,
  coronaIntensity: 0.7,
  glowIntensity: 0.4,
  limbDarkening: 0.6,
};

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set) => ({
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
    nebula: DEFAULT_NEBULA,
    sun: DEFAULT_SUN,

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
    setExportFormat: (exportFormat) => set({ exportFormat }),
    setExportResolution: (exportResolution) => set({ exportResolution }),
    setIsExporting: (isExporting) => set({ isExporting }),
    setExportProgress: (exportProgress) => set({ exportProgress }),
    setActivePanel: (activePanel) => set({ activePanel }),
    setShowPreview: (showPreview) => set({ showPreview }),
    requestRedraw: () => set({ needsRedraw: true }),
    clearRedraw: () => set({ needsRedraw: false }),
    randomizeSeed: () => set({ seed: Math.floor(Math.random() * 2147483647), needsRedraw: true }),
  })),
);
