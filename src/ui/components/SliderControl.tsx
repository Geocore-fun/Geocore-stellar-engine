/**
 * iOS-style labeled slider control.
 *
 * Displays label on left, formatted value on right, and a
 * clean slider track with a circular white thumb.
 */

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Optional display formatter (e.g. for integers, percentages) */
  format?: (value: number) => string;
  onChange: (value: number) => void;
}

function defaultFormat(value: number, step: number): string {
  if (step >= 1000) return value.toLocaleString();
  if (step >= 1) return Math.round(value).toString();
  if (step >= 0.1) return value.toFixed(1);
  return value.toFixed(2);
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step = 0.01,
  format,
  onChange,
}: SliderControlProps) {
  const displayValue = format ? format(value) : defaultFormat(value, step);

  return (
    <div className="flex flex-col gap-1.5 py-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-text-label">{label}</span>
        <span className="min-w-[40px] text-right font-mono text-[11px] text-text-secondary">
          {displayValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}
