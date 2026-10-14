/**
 * A labelled {@link Select}: the label is a real element the listbox is
 * named by, laid out stacked (sidebar panels) or inline (toolbar, rows).
 */

import { useId } from 'react';
import { Select, type SelectOption } from './Select';

interface SelectFieldProps<T extends string | number> {
  label: string;
  value: T;
  options: readonly SelectOption<T>[];
  onChange: (value: T) => void;
  layout?: 'stacked' | 'inline';
  size?: 'sm' | 'md';
  disabled?: boolean;
  /** Extra text under a stacked field. */
  help?: string;
  title?: string;
}

export function SelectField<T extends string | number>({
  label,
  value,
  options,
  onChange,
  layout = 'stacked',
  size = 'md',
  disabled,
  help,
  title,
}: SelectFieldProps<T>) {
  const labelId = useId();

  if (layout === 'inline') {
    return (
      <div className="flex items-center justify-between gap-2">
        <span id={labelId} className="text-[12px] text-text-label">
          {label}
        </span>
        <Select
          value={value}
          options={options}
          onChange={onChange}
          labelledBy={labelId}
          size={size}
          disabled={disabled}
          title={title}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 py-1.5">
      <span id={labelId} className="text-[12px] text-text-label">
        {label}
      </span>
      <Select
        value={value}
        options={options}
        onChange={onChange}
        labelledBy={labelId}
        size={size}
        disabled={disabled}
        title={title}
        className="w-full"
      />
      {help && <p className="text-[11px] leading-snug text-text-muted">{help}</p>}
    </div>
  );
}
