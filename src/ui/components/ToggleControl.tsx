/**
 * iOS-style on/off switch with its label.
 *
 * Built on a real, visually hidden checkbox (role="switch") so the label is
 * clickable, Space toggles it, and assistive tech reads "on/off" with the
 * label's name. The track and thumb are drawn in CSS (see .switch-track).
 */

interface ToggleControlProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function ToggleControl({ label, checked, onChange, disabled = false }: ToggleControlProps) {
  return (
    <label className="check-label flex cursor-pointer items-center justify-between gap-3 py-1.5">
      <span className="text-[12px] text-text-label">{label}</span>
      <input
        type="checkbox"
        role="switch"
        className="check-input"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch-track" aria-hidden="true">
        <span className="switch-thumb" />
      </span>
    </label>
  );
}
