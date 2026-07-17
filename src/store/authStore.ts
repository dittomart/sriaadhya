import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_PREFIX } from '@/utils/storageKeys';
import type { AuthUser } from '@/types';

interface AuthState {
  user: AuthUser | null;
  authToken: string | null;
  setSession: (user: AuthUser, token: string | null) => void;
  setWallet: (balance: number) => void;
  /** `keepCart` is for an expired token — the same customer, needing a fresh
      session. A logout they asked for clears the basket too. */
  logout: (opts?: { keepCart?: boolean }) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      authToken: null,
      setSession: (user, token) => set({ user, authToken: token }),
      setWallet: (balance) =>
        set((s) => (s.user ? { user: { ...s.user, wallet: balance } } : {})),
      logout: () => set({ user: null, authToken: null }),
    }),
    {
      name: `${STORAGE_PREFIX}auth`,
      version: 3,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function isLoggedIn(): boolean {
  const { user, authToken } = useAuthStore.getState();
  return !!user && !!authToken;
}
