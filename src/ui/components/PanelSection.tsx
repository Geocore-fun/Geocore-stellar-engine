/**
 * Collapsible panel section for sidebar controls.
 */

import { useState, type ReactNode } from 'react';

interface PanelSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function PanelSection({ title, defaultOpen = true, children }: PanelSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
      >
        <span
          className="inline-block transition-transform"
          style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
        >
          ▶
        </span>
        {title}
      </button>
      {isOpen && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}
