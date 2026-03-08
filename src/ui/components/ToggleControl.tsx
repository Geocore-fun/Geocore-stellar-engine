/**
 * iOS-style toggle switch.
 *
 * Mimics the native iOS UISwitch with a pill track,
 * circular white thumb with shadow, and smooth animation.
 */

interface ToggleControlProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleControl({ label, checked, onChange }: ToggleControlProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[12px] text-text-label">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className="relative inline-flex h-6.5 w-11.5 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200"
        style={{
          backgroundColor: checked ? 'var(--color-accent)' : 'rgba(255,255,255,0.1)',
        }}
      >
        <span
          className="pointer-events-none inline-block h-5.5 w-5.5 rounded-full bg-white transition-transform duration-200"
          style={{
            transform: checked ? 'translateX(22px)' : 'translateX(2px)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3), 0 1px 1px rgba(0,0,0,0.15)',
          }}
        />
      </button>
    </div>
  );
}
