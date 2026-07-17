import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_PREFIX } from '@/utils/storageKeys';
import type { Address, Bill, Order, PayMethod } from '@/types';

export type FoodFilter = 'all' | 'veg' | 'non-veg' | 'other';

interface AppState {
  orders: Order[];
  activeOrder: Order | null;
  favOrders: Order[];
  addresses: Address[];
  activeAddressId: string | null;
  /** Bill snapshot handed from cart → payment → order-success. */
  checkout: Bill | null;
  payMethod: PayMethod;
  foodFilter: FoodFilter;

  placeOrder: (order: Order) => void;
  setActiveOrder: (order: Order | null) => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
  saveFavOrder: (order: Order) => void;

  addAddress: (address: Address) => void;
  deleteAddress: (id: string) => void;
  setActiveAddress: (id: string) => void;

  setCheckout: (bill: Bill) => void;
  setPayMethod: (m: PayMethod) => void;
  setFoodFilter: (f: FoodFilter) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      orders: [],
      activeOrder: null,
      favOrders: [],
      addresses: [],
      activeAddressId: null,
      checkout: null,
      payMethod: 'upi',
      foodFilter: 'all',

      placeOrder: (order) =>
        set((s) => ({ orders: [order, ...s.orders], activeOrder: order })),
      setActiveOrder: (order) => set({ activeOrder: order }),
      updateOrderStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
          activeOrder: s.activeOrder?.id === id ? { ...s.activeOrder, status } : s.activeOrder,
        })),
      saveFavOrder: (order) => set((s) => ({ favOrders: [order, ...s.favOrders] })),

      addAddress: (address) =>
        set((s) => ({ addresses: [...s.addresses, address], activeAddressId: address.id })),
      deleteAddress: (id) =>
        set((s) => ({
          addresses: s.addresses.filter((a) => a.id !== id),
          activeAddressId: s.activeAddressId === id ? null : s.activeAddressId,
        })),
      setActiveAddress: (id) => set({ activeAddressId: id }),

      setCheckout: (bill) => set({ checkout: bill }),
      setPayMethod: (m) => set({ payMethod: m }),
      setFoodFilter: (f) => set({ foodFilter: f }),
    }),
    {
      name: `${STORAGE_PREFIX}app`,
      version: 2,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const selectActiveAddress = (s: AppState): Address | undefined =>
  s.addresses.find((a) => a.id === s.activeAddressId);
