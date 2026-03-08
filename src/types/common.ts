/**
 * Shared type definitions for the SkyboxGenerator application.
 */

/** RGBA color as normalized [0..1] floats */
export type Color4 = [number, number, number, number];

/** RGB color as normalized [0..1] floats */
export type Color3 = [number, number, number];

/** Hex color string like '#ff0000' */
export type HexColor = `#${string}`;

/** Cubemap face identifiers */
export type CubeFace = 'px' | 'nx' | 'py' | 'ny' | 'pz' | 'nz';

/** All six cubemap faces in render order */
export const CUBE_FACES: readonly CubeFace[] = ['px', 'nx', 'py', 'ny', 'pz', 'nz'] as const;

/** Cubemap face labels for UI display */
export const CUBE_FACE_LABELS: Record<CubeFace, string> = {
  px: '+X (Right)',
  nx: '-X (Left)',
  py: '+Y (Top)',
  ny: '-Y (Bottom)',
  pz: '+Z (Front)',
  nz: '-Z (Back)',
};

/** Resolution preset */
export interface ResolutionPreset {
  label: string;
  size: number;
}

/** Standard resolution presets */
export const RESOLUTION_PRESETS: readonly ResolutionPreset[] = [
  { label: '512', size: 512 },
  { label: '1024', size: 1024 },
  { label: '2048', size: 2048 },
  { label: '4096', size: 4096 },
  { label: '8192', size: 8192 },
] as const;

/** Export format options */
export type ExportFormat = 'png-individual' | 'png-cross' | 'hdr' | 'exr';

/** Camera state for the preview viewport */
export interface CameraState {
  /** Horizontal rotation in radians */
  yaw: number;
  /** Vertical rotation in radians */
  pitch: number;
  /** Field of view in degrees */
  fov: number;
}
