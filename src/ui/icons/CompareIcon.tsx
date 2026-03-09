import type { IconProps } from './types';

/** Split-screen comparison icon — vertical divider with A|B halves */
export function CompareIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      {/* Outer rounded rect */}
      <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.3" />
      {/* Vertical divider */}
      <line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.3" />
      {/* A label */}
      <text x="4" y="8.5" textAnchor="middle" fill="currentColor" fontSize="4.5" fontWeight="600">
        A
      </text>
      {/* B label */}
      <text x="10" y="8.5" textAnchor="middle" fill="currentColor" fontSize="4.5" fontWeight="600">
        B
      </text>
    </svg>
  );
}
