import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { LS } from '@/utils/storageKeys';
import type { UserLocation } from '@/types';

interface LocationState {
  location: UserLocation | null;
  setLocation: (loc: UserLocation) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      location: null,
      setLocation: (loc) => set({ location: loc }),
      clearLocation: () => set({ location: null }),
    }),
    {
      name: LS.location,
      version: 2,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** Port of app.js `deliveringArea()` — falls back to the store's own town. */
export function deliveringArea(): string {
  const loc = useLocationStore.getState().location;
  return loc && loc.area ? loc.area : 'Avinashi';
}

/** Port of app.js `isServiceable()`. A location outside the zone may still browse. */
export function isServiceable(): boolean {
  const loc = useLocationStore.getState().location;
  return !!loc && loc.serviceable !== false;
}

/** Port of app.js `locationGate()` — true when any location has been captured. */
export function hasLocation(): boolean {
  const loc = useLocationStore.getState().location;
  return !!(loc && loc.latitude && loc.longitude);
}
