/**
 * Checkbox — a real <input type="checkbox">, visually hidden, with a styled box
 * drawn next to it.
 *
 * Keeping the native input means the browser supplies everything a checkbox
 * must do (Space toggles, the label is clickable, form semantics, screen-reader
 * state) and the custom part is purely visual. The focus ring shows on the box
 * only for keyboard focus.
 */

import type { ReactNode } from 'react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** The label content; the whole label is clickable. */
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  title?: string;
}

export function Checkbox({
  checked,
  onChange,
  children,
  disabled = false,
  className = '',
  title,
}: CheckboxProps) {
  return (
    <label
      className={`check-label flex cursor-pointer items-center gap-2 ${className}`}
      title={title}
    >
      <input
        type="checkbox"
        className="check-input"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="check-box" aria-hidden="true">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M2 5.2L4.1 7.2L8 2.8"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {children}
    </label>
  );
}
