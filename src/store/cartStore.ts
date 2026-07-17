import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_PREFIX } from '@/utils/storageKeys';
import type { CartLine } from '@/types';

interface CartState {
  lines: CartLine[];
  /** bumped on every add so the header cart icon can replay its pop */
  bump: number;
  add: (line: CartLine) => void;
  setQty: (lineId: string, qty: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
  replace: (lines: CartLine[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      bump: 0,

      add: (line) =>
        set((state) => {
          /* qty can arrive as a string from a reorder row — coerce before it
             can poison the merge with NaN or string concatenation. */
          const qty = Math.max(1, Math.floor(Number(line.qty)) || 1);
          const existing = state.lines.find((l) => l.lineId === line.lineId);
          const lines = existing
            ? state.lines.map((l) => (l.lineId === line.lineId ? { ...l, qty: l.qty + qty } : l))
            : [...state.lines, { ...line, qty }];
          return { lines, bump: state.bump + 1 };
        }),

      setQty: (lineId, qty) =>
        set((state) => ({
          lines:
            qty <= 0
              ? state.lines.filter((l) => l.lineId !== lineId)
              : state.lines.map((l) => (l.lineId === lineId ? { ...l, qty } : l)),
        })),

      remove: (lineId) => set((state) => ({ lines: state.lines.filter((l) => l.lineId !== lineId) })),
      clear: () => set({ lines: [] }),
      replace: (lines) => set({ lines }),
    }),
    {
      name: `${STORAGE_PREFIX}cart`,
      version: 3,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }) as CartState,
    },
  ),
);

export const selectCartCount = (s: CartState): number => s.lines.reduce((n, l) => n + l.qty, 0);

/** unitPrice — never basePrice: a variant-priced item's basePrice is 0. */
export const selectCartSubtotal = (s: CartState): number =>
  s.lines.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);

export function useCartSubtotal(): number {
  return useCartStore(selectCartSubtotal);
}
