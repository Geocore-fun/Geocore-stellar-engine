import type { IconProps } from './types';

/** Chevron right (›) icon — used for collapsible panel sections */
export function ChevronRightIcon({
  size = 12,
  className,
  style,
}: IconProps & { style?: React.CSSProperties }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
      className={className}
      style={style}
    >
      <path
        d="M4.5 2.5L8 6L4.5 9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
