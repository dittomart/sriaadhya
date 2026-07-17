import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { LS } from '@/utils/storageKeys';
import { BRAND } from '@/api/_seed';
import { useLocationStore } from '@/store/locationStore';
import type { CartLine, Product } from '@/types';

interface AddOpts {
  variant?: string | null;
  price?: number;
}

interface CartState {
  lines: CartLine[];
  /** Set on every add so the header cart icon can replay its pop animation. */
  bump: number;
  add: (product: Product, qty?: number, opts?: AddOpts) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  replace: (lines: CartLine[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      bump: 0,
      add: (p, qty = 1, opts = {}) =>
        set((state) => {
          const key = opts.variant ? `${p.id}__${opts.variant}` : p.id;
          const price = opts.price || p.price;
          const existing = state.lines.find((i) => i.key === key);
          const lines = existing
            ? state.lines.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i))
            : [
                ...state.lines,
                {
                  key,
                  id: p.id,
                  name: p.name + (opts.variant ? ` (${opts.variant})` : ''),
                  price,
                  img: p.img,
                  foodType: p.foodType,
                  qty,
                  unit: opts.variant || p.unit,
                },
              ];
          return { lines, bump: state.bump + 1 };
        }),
      setQty: (key, qty) =>
        set((state) => ({
          lines:
            qty <= 0
              ? state.lines.filter((i) => i.key !== key)
              : state.lines.map((i) => (i.key === key ? { ...i, qty } : i)),
        })),
      remove: (key) => set((state) => ({ lines: state.lines.filter((i) => i.key !== key) })),
      clear: () => set({ lines: [] }),
      replace: (lines) => set({ lines }),
    }),
    {
      name: LS.cart,
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lines: state.lines }) as CartState,
    },
  ),
);

/** Port of app.js `cartCount()`. */
export const selectCartCount = (s: CartState): number => s.lines.reduce((sum, i) => sum + i.qty, 0);

/** Port of app.js `cartSubtotal()`. */
export const selectCartSubtotal = (s: CartState): number =>
  s.lines.reduce((sum, i) => sum + i.price * i.qty, 0);

/** Port of app.js `deliveryCharge()` — distance-based, floor of ₹19. */
export function deliveryCharge(): number {
  const loc = useLocationStore.getState().location;
  const dist = loc?.distance_from_store_km || 3;
  return Math.max(19, Math.round(dist * BRAND.baseDeliveryPerKm));
}
