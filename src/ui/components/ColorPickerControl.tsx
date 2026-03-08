/**
 * iOS-style color picker control.
 *
 * Shows a labeled color swatch that opens a popover with
 * a react-colorful hex picker.
 */

import type { HexColor } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';

interface ColorPickerControlProps {
  label: string;
  value: HexColor;
  onChange: (color: HexColor) => void;
}

export function ColorPickerControl({ label, value, onChange }: ColorPickerControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const swatchRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClick(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        swatchRef.current &&
        !swatchRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  const handleChange = useCallback(
    (color: string) => {
      onChange(color as HexColor);
    },
    [onChange],
  );

  return (
    <div className="relative flex items-center justify-between py-1.5">
      <span className="text-[12px] text-text-label">{label}</span>
      <button
        ref={swatchRef}
        onClick={() => setIsOpen(!isOpen)}
        className="h-6 w-6 rounded-full shadow-sm ring-1 ring-white/15 transition-transform hover:scale-110 active:scale-95"
        style={{ backgroundColor: value }}
        title={value}
      />
      {isOpen && (
        <div
          ref={popoverRef}
          className="glass-popover absolute right-0 top-8 z-50 overflow-hidden rounded-xl shadow-2xl"
          style={{ padding: 12 }}
        >
          <HexColorPicker color={value} onChange={handleChange} />
          <div className="mt-2 flex items-center gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => {
                const v = e.target.value;
                if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                  onChange(v as HexColor);
                }
              }}
              className="w-full rounded-md bg-white/5 px-2 py-1 text-center font-mono text-xs text-text-primary ring-1 ring-white/10 focus:outline-none focus:ring-1 focus:ring-accent"
              maxLength={7}
            />
          </div>
        </div>
      )}
    </div>
  );
}
