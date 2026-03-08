/**
 * Labeled slider control for parameter adjustment.
 */

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

export function SliderControl({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
}: SliderControlProps) {
  return (
    <div className="flex flex-col gap-1 py-1">
      <div className="flex items-center justify-between">
        <label className="text-xs text-text-secondary">{label}</label>
        <span className="text-xs font-mono text-text-muted">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-bg-input accent-accent"
      />
    </div>
  );
}
