/**
 * HistogramOverlay — real-time brightness/color histogram display.
 *
 * Renders per-channel (R, G, B) and luminance histograms on a canvas
 * overlaid on the viewport. Updated after each cubemap re-render.
 *
 * Toggle with the 'H' key or toolbar button.
 */

import { type HistogramData } from '@/utils/histogram';
import { useCallback, useEffect, useRef, useState } from 'react';

const CANVAS_WIDTH = 260;
const CANVAS_HEIGHT = 100;
const GRAPH_MARGIN = 2;
const GRAPH_WIDTH = 256;
const GRAPH_HEIGHT = CANVAS_HEIGHT - GRAPH_MARGIN * 2;

interface HistogramOverlayProps {
  /** Histogram data to display (null = nothing drawn) */
  data: HistogramData | null;
}

type ChannelMode = 'rgb' | 'luminance';

export function HistogramOverlay({ data }: HistogramOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<ChannelMode>('rgb');
  const [visible, setVisible] = useState(false);

  // Toggle visibility with H key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key.toLowerCase() === 'h') {
        e.preventDefault();
        setVisible((v) => !v);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Draw histogram whenever data or mode changes
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT, 6);
    ctx.fill();

    if (data.maxCount === 0) return;

    // Use log scale for better visibility
    const logMax = Math.log(data.maxCount + 1);

    if (mode === 'rgb') {
      // Draw each channel as a semi-transparent filled curve
      drawChannel(ctx, data.r, logMax, 'rgba(255, 60, 60, 0.5)', 'rgba(255, 60, 60, 0.8)');
      drawChannel(ctx, data.g, logMax, 'rgba(60, 255, 60, 0.5)', 'rgba(60, 255, 60, 0.8)');
      drawChannel(ctx, data.b, logMax, 'rgba(60, 100, 255, 0.5)', 'rgba(60, 100, 255, 0.8)');
    } else {
      drawChannel(ctx, data.lum, logMax, 'rgba(200, 200, 200, 0.5)', 'rgba(200, 200, 200, 0.9)');
    }

    // Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '9px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(mode === 'rgb' ? 'RGB' : 'Lum', 5, 12);
    ctx.textAlign = 'right';
    ctx.fillText(`avg ${data.avgLuminance.toFixed(0)}`, CANVAS_WIDTH - 5, 12);
  }, [data, mode]);

  useEffect(() => {
    draw();
  }, [draw]);

  if (!visible) return null;

  return (
    <div
      className="absolute bottom-14 right-3 z-30 cursor-pointer select-none"
      onClick={() => setMode((m) => (m === 'rgb' ? 'luminance' : 'rgb'))}
      title="Click to toggle RGB / Luminance"
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      />
    </div>
  );
}

/** Draw a single channel histogram as a filled polygon */
function drawChannel(
  ctx: CanvasRenderingContext2D,
  bins: Uint32Array,
  logMax: number,
  fillColor: string,
  strokeColor: string,
): void {
  ctx.beginPath();
  ctx.moveTo(GRAPH_MARGIN, CANVAS_HEIGHT - GRAPH_MARGIN);

  for (let i = 0; i < GRAPH_WIDTH; i++) {
    const count = bins[i];
    const h = count > 0 ? (Math.log(count + 1) / logMax) * GRAPH_HEIGHT : 0;
    const x = GRAPH_MARGIN + i;
    const y = CANVAS_HEIGHT - GRAPH_MARGIN - h;
    ctx.lineTo(x, y);
  }

  ctx.lineTo(GRAPH_MARGIN + GRAPH_WIDTH, CANVAS_HEIGHT - GRAPH_MARGIN);
  ctx.closePath();

  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 0.5;
  ctx.stroke();
}
