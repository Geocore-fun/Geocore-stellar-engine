/**
 * What Geocore for Windows accepts as a custom skybox — the one place these
 * numbers live. The help panel, the "Export for Geocore" button and the size
 * check after export all read from here; if the game's limits change, change
 * them here only.
 */

import type { ExportFormat } from '@/types';

export const GEOCORE_SKYBOX = {
  /** Geocore imports a single cross-layout image. */
  format: 'png-cross' satisfies ExportFormat,
  /** Per-face resolution to export by default. */
  resolution: 1024,
  /** Per-face resolution to fall back to when the file is too large. */
  fallbackResolution: 512,
  /** Largest face the game accepts; 2048 and up are refused. */
  maxFaceSize: 1024,
  /** Largest file the game accepts (16 MiB). */
  maxFileBytes: 16 * 1024 * 1024,
  /** Player-facing help, including the game's refusal messages. */
  supportUrl: 'https://geocore.fun/support',
} as const;

/** Format a byte count in MiB: whole numbers as is, otherwise one decimal. */
export function formatMiB(bytes: number): string {
  const mib = bytes / (1024 * 1024);
  return `${Number.isInteger(mib) ? mib : mib.toFixed(1)} MiB`;
}
