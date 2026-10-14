/**
 * Dialog shell shared by the About and Geocore panels.
 *
 * role="dialog" + aria-modal, named by its title. Focus moves into the dialog
 * on open, Tab is kept inside it, Escape or a backdrop click closes it, and
 * focus returns to whatever opened it.
 */

import { CloseIcon } from '@/ui/icons';
import { useEffect, useId, useRef, type ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Rendered as the dialog's heading and accessible name. */
  title: string;
  /** Optional content left of the title (e.g. a logo). */
  leading?: ReactNode;
  /** Small line under the title. */
  subtitle?: string;
  /** Tailwind max-width class for the panel. */
  widthClass?: string;
  children: ReactNode;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({
  isOpen,
  onClose,
  title,
  leading,
  subtitle,
  widthClass = 'max-w-sm',
  children,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    // Focus the first control after the close button, or the close button.
    const focusables = panel?.querySelectorAll<HTMLElement>(FOCUSABLE);
    (focusables?.[1] ?? focusables?.[0] ?? panel)?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      opener?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`glass-popover relative mx-4 flex max-h-[calc(100vh-2rem)] w-full flex-col overflow-hidden rounded-2xl shadow-2xl outline-none ${widthClass}`}
        style={{ animation: 'modalFadeInScale 0.2s ease-out' }}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/5 px-5 pt-5 pb-4">
          <div className="flex min-w-0 items-center gap-3">
            {leading}
            <div className="min-w-0">
              <h2 id={titleId} className="text-[15px] font-semibold text-text-primary">
                {title}
              </h2>
              {subtitle && <p className="text-[11px] text-text-muted">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focus-ring flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-text-muted transition-all hover:bg-white/10 hover:text-text-primary active:scale-90"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto">{children}</div>
      </div>

      <style>{`
        @keyframes modalFadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          [role='dialog'] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
