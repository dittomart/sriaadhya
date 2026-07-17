import { create } from 'zustand';

export type ToastKind = '' | 'ok' | 'err';

export interface ToastItem {
  id: number;
  msg: string;
  kind: ToastKind;
  icon: string;
}

interface ToastState {
  toasts: ToastItem[];
  push: (msg: string, kind?: ToastKind, icon?: string) => void;
  dismiss: (id: number) => void;
}

let nextId = 0;

/** Port of app.js `toast()` — same 1.9s dwell, same ok/err styling. */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (msg, kind = '', icon = 'check') => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts, { id, msg, kind, icon }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 1900);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Fire a toast from anywhere, including outside React. */
export const toast = (msg: string, kind: ToastKind = '', icon = 'check'): void =>
  useToastStore.getState().push(msg, kind, icon);

export function useToast() {
  return useToastStore((s) => s.push);
}
