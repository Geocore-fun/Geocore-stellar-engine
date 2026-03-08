/**
 * Cubemap math utilities.
 *
 * Provides view matrices for each cubemap face and
 * projection matrix for 90° FOV rendering.
 */

import type { CubeFace } from '@/types';
import { mat4 } from 'gl-matrix';

/** Camera look directions and up vectors for each cubemap face */
const FACE_DIRECTIONS: Record<
  CubeFace,
  { target: [number, number, number]; up: [number, number, number] }
> = {
  px: { target: [1, 0, 0], up: [0, -1, 0] },
  nx: { target: [-1, 0, 0], up: [0, -1, 0] },
  py: { target: [0, 1, 0], up: [0, 0, 1] },
  ny: { target: [0, -1, 0], up: [0, 0, -1] },
  pz: { target: [0, 0, 1], up: [0, -1, 0] },
  nz: { target: [0, 0, -1], up: [0, -1, 0] },
};

/**
 * Get the view matrix for a specific cubemap face.
 * Camera is at origin, looking in the face direction.
 */
export function getCubeFaceViewMatrix(face: CubeFace): mat4 {
  const { target, up } = FACE_DIRECTIONS[face];
  const view = mat4.create();
  mat4.lookAt(view, [0, 0, 0], target, up);
  return view;
}

/**
 * Get the projection matrix for cubemap rendering.
 * 90° FOV, 1:1 aspect ratio, infinite far plane.
 */
export function getCubemapProjectionMatrix(): mat4 {
  const proj = mat4.create();
  mat4.perspective(proj, Math.PI / 2, 1.0, 0.01, 100.0);
  return proj;
}

/**
 * Get all 6 view matrices as a map.
 */
export function getAllCubeFaceViewMatrices(): Record<CubeFace, mat4> {
  return {
    px: getCubeFaceViewMatrix('px'),
    nx: getCubeFaceViewMatrix('nx'),
    py: getCubeFaceViewMatrix('py'),
    ny: getCubeFaceViewMatrix('ny'),
    pz: getCubeFaceViewMatrix('pz'),
    nz: getCubeFaceViewMatrix('nz'),
  };
}
