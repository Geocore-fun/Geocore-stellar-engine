/**
 * WebGL error handling and GPU capability detection.
 *
 * Provides:
 *   - Context lost/restored event handling
 *   - GPU capability detection and warnings
 *   - Shader error formatting
 *   - Export error recovery
 */

/** GPU capability limits relevant to skybox generation */
export interface GPUCapabilities {
  /** Maximum texture size (per dimension) */
  maxTextureSize: number;
  /** Maximum cubemap texture size */
  maxCubeMapSize: number;
  /** Maximum viewport dimensions */
  maxViewportDims: [number, number];
  /** Maximum render buffer size */
  maxRenderbufferSize: number;
  /** GPU vendor */
  vendor: string;
  /** GPU renderer string */
  rendererInfo: string;
  /** WebGL version */
  webglVersion: string;
  /** Maximum number of vertex attributes */
  maxVertexAttribs: number;
  /** Whether float textures are supported */
  floatTexturesSupported: boolean;
  /** Whether color buffer float is supported */
  colorBufferFloatSupported: boolean;
}

/** Warning about a GPU limitation */
export interface GPUWarning {
  severity: 'info' | 'warning' | 'error';
  message: string;
}

/**
 * Detect GPU capabilities and return any warnings about limitations.
 */
export function detectGPUCapabilities(gl: WebGL2RenderingContext): {
  capabilities: GPUCapabilities;
  warnings: GPUWarning[];
} {
  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

  const capabilities: GPUCapabilities = {
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) as number,
    maxCubeMapSize: gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE) as number,
    maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS) as [number, number],
    maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number,
    vendor: debugInfo ? (gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) as string) : 'Unknown',
    rendererInfo: debugInfo
      ? (gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) as string)
      : 'Unknown',
    webglVersion: gl.getParameter(gl.VERSION) as string,
    maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS) as number,
    floatTexturesSupported: !!gl.getExtension('EXT_color_buffer_float'),
    colorBufferFloatSupported: !!gl.getExtension('EXT_color_buffer_float'),
  };

  const warnings: GPUWarning[] = [];

  // Check major limitations
  if (capabilities.maxTextureSize < 4096) {
    warnings.push({
      severity: 'warning',
      message: `Max texture size is ${capabilities.maxTextureSize}. Export resolutions above this will use tiled rendering, which may be slower.`,
    });
  }

  if (capabilities.maxCubeMapSize < 2048) {
    warnings.push({
      severity: 'warning',
      message: `Max cubemap size is ${capabilities.maxCubeMapSize}. Preview quality may be limited.`,
    });
  }

  if (!capabilities.floatTexturesSupported) {
    warnings.push({
      severity: 'info',
      message: 'Float textures not supported. HDR export will use tone-mapped 8-bit data.',
    });
  }

  if (capabilities.maxVertexAttribs < 16) {
    warnings.push({
      severity: 'info',
      message: `Limited vertex attributes (${capabilities.maxVertexAttribs}). Complex star rendering may be affected.`,
    });
  }

  // Check for software renderer
  const renderer = capabilities.rendererInfo.toLowerCase();
  if (
    renderer.includes('swiftshader') ||
    renderer.includes('llvmpipe') ||
    renderer.includes('software')
  ) {
    warnings.push({
      severity: 'error',
      message:
        'Software GPU renderer detected. Performance will be very poor. Please use a hardware-accelerated browser.',
    });
  }

  return { capabilities, warnings };
}

/**
 * Set up WebGL context lost/restored event handlers.
 *
 * @param canvas    The canvas element
 * @param onLost    Called when the context is lost
 * @param onRestored Called when the context is restored (re-init resources)
 * @returns Cleanup function to remove event listeners
 */
export function setupContextLostHandling(
  canvas: HTMLCanvasElement,
  onLost: () => void,
  onRestored: () => void,
): () => void {
  function handleContextLost(e: Event): void {
    e.preventDefault(); // Allows context restoration
    console.warn('[WebGL] Context lost');
    onLost();
  }

  function handleContextRestored(): void {
    console.log('[WebGL] Context restored');
    onRestored();
  }

  canvas.addEventListener('webglcontextlost', handleContextLost);
  canvas.addEventListener('webglcontextrestored', handleContextRestored);

  return () => {
    canvas.removeEventListener('webglcontextlost', handleContextLost);
    canvas.removeEventListener('webglcontextrestored', handleContextRestored);
  };
}

/**
 * Format a shader compilation error for display.
 *
 * Extracts line numbers and provides context around the error.
 */
export function formatShaderError(shaderSource: string, errorLog: string): string {
  const lines = shaderSource.split('\n');
  const errorLines: string[] = ['Shader compilation error:'];

  // Parse error log for line numbers (format varies by GPU driver)
  const lineRegex = /(?:ERROR|WARNING):\s*(?:\d+:)?(\d+):\s*(.*)/g;
  let match;

  while ((match = lineRegex.exec(errorLog)) !== null) {
    const lineNum = parseInt(match[1], 10);
    const message = match[2];
    errorLines.push(`  Line ${lineNum}: ${message}`);

    // Show context (2 lines before + error line + 2 lines after)
    const start = Math.max(0, lineNum - 3);
    const end = Math.min(lines.length - 1, lineNum + 1);
    for (let i = start; i <= end; i++) {
      const marker = i === lineNum - 1 ? '>>>' : '   ';
      errorLines.push(`  ${marker} ${i + 1}: ${lines[i]}`);
    }
  }

  // If no line numbers found, just show the raw log
  if (errorLines.length === 1) {
    errorLines.push(errorLog);
  }

  return errorLines.join('\n');
}

/**
 * Check for WebGL errors and log them.
 * Useful for debugging — call after suspect GL operations.
 */
export function checkGLError(gl: WebGL2RenderingContext, label: string): boolean {
  const error = gl.getError();
  if (error !== gl.NO_ERROR) {
    const errorNames: Record<number, string> = {
      [gl.INVALID_ENUM]: 'INVALID_ENUM',
      [gl.INVALID_VALUE]: 'INVALID_VALUE',
      [gl.INVALID_OPERATION]: 'INVALID_OPERATION',
      [gl.INVALID_FRAMEBUFFER_OPERATION]: 'INVALID_FRAMEBUFFER_OPERATION',
      [gl.OUT_OF_MEMORY]: 'OUT_OF_MEMORY',
      [gl.CONTEXT_LOST_WEBGL]: 'CONTEXT_LOST_WEBGL',
    };
    console.error(`[WebGL Error] ${label}: ${errorNames[error] ?? `0x${error.toString(16)}`}`);
    return true;
  }
  return false;
}
