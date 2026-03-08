/**
 * BackgroundLayer — renders a solid color background.
 *
 * This is the base layer (order 0) that clears the framebuffer
 * with the configured background color.
 */

import type { RenderLayer, RenderParams } from '@/layers/RenderLayer';
import { FullscreenQuad } from '@/renderer/FullscreenQuad';
import type { Renderer } from '@/renderer/Renderer';
import type { HexColor } from '@/types';
import { hexToRgb } from '@/utils/color';

import backgroundFragSrc from '@/shaders/background.frag.glsl?raw';
import fullscreenVertSrc from '@/shaders/fullscreen.vert.glsl?raw';

export interface BackgroundParams {
  color: HexColor;
}

export class BackgroundLayer implements RenderLayer {
  readonly id = 'background';
  readonly name = 'Background';
  enabled = true;
  order = 0;

  private program: WebGLProgram | null = null;
  private quad: FullscreenQuad | null = null;
  private uColorLoc: WebGLUniformLocation | null = null;
  private uInvViewProjLoc: WebGLUniformLocation | null = null;
  private color: HexColor = '#000000';

  init(renderer: Renderer): void {
    this.program = renderer.createProgram(fullscreenVertSrc, backgroundFragSrc);
    const { gl } = renderer;
    this.uColorLoc = gl.getUniformLocation(this.program, 'uColor');
    this.uInvViewProjLoc = gl.getUniformLocation(this.program, 'uInvViewProj');
    this.quad = new FullscreenQuad(gl);
  }

  render(renderer: Renderer, _params: RenderParams): void {
    const { gl } = renderer;
    if (!this.program || !this.quad) return;

    gl.useProgram(this.program);

    // Set background color
    const [r, g, b] = hexToRgb(this.color);
    gl.uniform3f(this.uColorLoc, r, g, b);

    // Set inverse view-projection matrix for ray direction calculation
    // For background, we don't really need it but the shader expects it
    const invViewProj = new Float32Array(16);
    invViewProj[0] = 1;
    invViewProj[5] = 1;
    invViewProj[10] = 1;
    invViewProj[15] = 1;
    gl.uniformMatrix4fv(this.uInvViewProjLoc, false, invViewProj);

    // Disable blending for base layer (opaque fill)
    gl.disable(gl.BLEND);
    this.quad.draw();
    gl.enable(gl.BLEND);
  }

  updateParams(params: Record<string, unknown>): void {
    if (params['color'] !== undefined) {
      this.color = params['color'] as HexColor;
    }
  }

  getParams(): Record<string, unknown> {
    return { color: this.color };
  }

  dispose(): void {
    this.quad?.dispose();
    this.quad = null;
    this.program = null;
  }
}
