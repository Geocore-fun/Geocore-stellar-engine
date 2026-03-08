/**
 * Glassmorphism collapsible panel section.
 *
 * Renders as a frosted glass card with a header that toggles
 * expand/collapse with smooth chevron rotation.
 */

import { ChevronRightIcon } from '@/ui/icons';
import { useState, type ReactNode } from 'react';

interface PanelSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function PanelSection({ title, defaultOpen = true, children }: PanelSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mx-3 my-1.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="glass-card flex w-full items-center justify-between px-3 py-2.5 text-left transition-all"
        style={{
          borderRadius: isOpen ? '10px 10px 0 0' : '10px',
          borderBottom: isOpen ? '1px solid rgba(255,255,255,0.03)' : undefined,
        }}
      >
        <span className="text-[13px] font-semibold text-text-primary">{title}</span>
        <ChevronRightIcon
          className="text-text-muted transition-transform duration-200"
          style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}
        />
      </button>
      {isOpen && (
        <div
          className="rounded-b-md px-3 pb-3 pt-1"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            borderLeft: '1px solid rgba(255,255,255,0.05)',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
