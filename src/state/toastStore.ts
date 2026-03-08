/**
 * Lightweight toast notification store.
 *
 * Provides non-blocking user feedback for errors, warnings, and info messages.
 * Toasts auto-dismiss after a configurable duration.
 */

import { create } from 'zustand';

export type ToastType = 'info' | 'warning' | 'error' | 'success';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  /** Auto-dismiss duration in ms (0 = persistent) */
  duration: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

let nextId = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (type, message, duration = 5000) => {
    const id = `toast-${nextId++}`;
    const toast: Toast = { id, type, message, duration };

    set((s) => ({ toasts: [...s.toasts, toast] }));

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },
}));
