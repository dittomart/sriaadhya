import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_PREFIX } from '@/utils/storageKeys';
import type { Coupon } from '@/types';

interface CouponState {
  active: Coupon | null;
  apply: (c: Coupon) => void;
  clear: () => void;
}

export const useCouponStore = create<CouponState>()(
  persist(
    (set) => ({
      active: null,
      apply: (active) => set({ active }),
      clear: () => set({ active: null }),
    }),
    {
      name: `${STORAGE_PREFIX}coupon`,
      version: 3,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
