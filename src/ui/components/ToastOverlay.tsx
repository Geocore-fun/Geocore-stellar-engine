/**
 * Toast notification overlay — displays transient feedback messages.
 *
 * Renders as a stack in the bottom-right corner of the viewport.
 * Auto-dismisses after the configured duration.
 */

import { useToastStore, type Toast } from '@/state/toastStore';

const TYPE_STYLES: Record<Toast['type'], string> = {
  info: 'bg-blue-600/90 border-blue-400/30',
  success: 'bg-green-600/90 border-green-400/30',
  warning: 'bg-yellow-600/90 border-yellow-400/30',
  error: 'bg-red-600/90 border-red-400/30',
};

const TYPE_ICONS: Record<Toast['type'], string> = {
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  error: '✕',
};

export function ToastOverlay() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 shadow-lg backdrop-blur-sm ${TYPE_STYLES[toast.type]}`}
          style={{ maxWidth: 360, animation: 'fadeIn 0.2s ease-out' }}
        >
          <span className="mt-0.5 text-sm">{TYPE_ICONS[toast.type]}</span>
          <p className="flex-1 text-[12px] leading-relaxed text-white">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="mt-0.5 text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
