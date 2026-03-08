/**
 * RenderLayer interface — the core abstraction for composable skybox layers.
 *
 * Each layer (stars, nebula, sun, etc.) implements this interface.
 * The pipeline renders layers in order, compositing via alpha blending.
 */

import type { Renderer } from '@/renderer/Renderer';
import type { CubeFace } from '@/types';

/** Parameters passed to each layer's render method */
export interface RenderParams {
  /** Which cubemap face is being rendered */
  face: CubeFace;
  /** Face resolution in pixels */
  faceSize: number;
  /** View matrix for this face (mat4 from gl-matrix) */
  viewMatrix: Float32Array;
  /** Projection matrix (90° FOV perspective) */
  projectionMatrix: Float32Array;
  /** Global seed for deterministic generation */
  seed: number;
}

/** Base interface all render layers must implement */
export interface RenderLayer {
  /** Unique layer identifier */
  readonly id: string;
  /** Display name for UI */
  readonly name: string;
  /** Whether the layer is currently enabled */
  enabled: boolean;
  /** Render order (lower = rendered first / further back) */
  order: number;

  /** Initialize GPU resources (shaders, buffers, textures) */
  init(renderer: Renderer): void;

  /** Render this layer for one cubemap face */
  render(renderer: Renderer, params: RenderParams): void;

  /** Update layer-specific parameters (e.g., from UI controls) */
  updateParams(params: Record<string, unknown>): void;

  /** Get current parameter values for UI display */
  getParams(): Record<string, unknown>;

  /** Release all GPU resources */
  dispose(): void;
}
