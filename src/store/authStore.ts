import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { LS } from '@/utils/storageKeys';
import type { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      login: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: LS.user,
      version: 2,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/** Port of app.js `isLoggedIn()`. */
export function isLoggedIn(): boolean {
  const u = useAuthStore.getState().user;
  return !!(u && u.loggedIn);
}
