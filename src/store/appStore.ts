import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_PREFIX } from '@/utils/storageKeys';
import type { Brand, StoreLocation } from '@/types';

export type FoodFilter = 'all' | 'veg' | 'non-veg' | 'other';
export type OrderType = 'delivery' | 'takeaway';

interface AppState {
  brand: Brand | null;
  storeLocation: StoreLocation | null;
  orderType: OrderType;
  foodFilter: FoodFilter;
  /** which saved address the checkout is quoting and shipping to */
  activeAddressId: string | null;

  setBrand: (b: Brand) => void;
  setStoreLocation: (l: StoreLocation) => void;
  setOrderType: (t: OrderType) => void;
  setFoodFilter: (f: FoodFilter) => void;
  setActiveAddress: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      brand: null,
      storeLocation: null,
      orderType: 'delivery',
      foodFilter: 'all',
      activeAddressId: null,

      setBrand: (brand) => set({ brand }),
      setStoreLocation: (storeLocation) => set({ storeLocation }),
      setOrderType: (orderType) => set({ orderType }),
      setFoodFilter: (foodFilter) => set({ foodFilter }),
      setActiveAddress: (activeAddressId) => set({ activeAddressId }),
    }),
    {
      name: `${STORAGE_PREFIX}app`,
      version: 3,
      storage: createJSONStorage(() => localStorage),
      /* storeLocation is deliberately NOT persisted. Its schedule and
         force-open/closed override drive whether the store is orderable at all;
         serving last session's snapshot would keep taking orders for a store the
         admin closed minutes ago, until /brand-locations resolves. */
      partialize: (s) => ({
        brand: s.brand,
        orderType: s.orderType,
        foodFilter: s.foodFilter,
        activeAddressId: s.activeAddressId,
      }),
    },
  ),
);
