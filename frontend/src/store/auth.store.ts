/**
 * Auth store — Zustand
 * Manages JWT token and user session with localStorage persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthStore {
  user:     User | null;
  token:    string | null;
  isLoading: boolean;
  login:    (user: User, token: string) => void;
  logout:   () => void;
  setUser:  (user: User) => void;
  setLoading: (val: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user:      null,
      token:     null,
      isLoading: false,

      login: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('strapi_jwt', token);
        }
        set({ user, token });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('strapi_jwt');
        }
        set({ user: null, token: null });
      },

      setUser:    (user)    => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name:    'auth-storage',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined' ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
