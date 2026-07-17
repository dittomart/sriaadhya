import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_PREFIX } from '@/utils/storageKeys';
import type { UserLocation } from '@/types';

interface LocationState {
  location: UserLocation | null;
  setLocation: (loc: UserLocation) => void;
  clear: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: null,
      setLocation: (location) => set({ location }),
      clear: () => set({ location: null }),
    }),
    {
      name: `${STORAGE_PREFIX}location`,
      version: 3,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** The area name the header and the delivery lines show. */
export function deliveringArea(): string {
  const loc = useLocationStore.getState().location;
  return loc?.area || 'Avinashi';
}

/** True when the pin is inside the store's delivery radius. Out-of-zone
    customers may still browse — this only gates checkout. */
export function isServiceable(): boolean {
  const loc = useLocationStore.getState().location;
  return !!loc && loc.serviceable !== false;
}
