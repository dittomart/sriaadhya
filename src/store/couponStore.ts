import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_PREFIX } from '@/utils/storageKeys';

interface CouponState {
  /** Applied on the cart right now. */
  applied: string | null;
  /** Chosen on /coupon, auto-applied on the next /cart visit. */
  pending: string | null;
  apply: (code: string) => void;
  clearApplied: () => void;
  setPending: (code: string) => void;
  consumePending: () => string | null;
}

export const useCouponStore = create<CouponState>()(
  persist(
    (set, get) => ({
      applied: null,
      pending: null,
      apply: (code) => set({ applied: code }),
      clearApplied: () => set({ applied: null }),
      setPending: (code) => set({ pending: code }),
      consumePending: () => {
        const code = get().pending;
        if (code) set({ pending: null });
        return code;
      },
    }),
    {
      name: `${STORAGE_PREFIX}coupon`,
      version: 2,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
