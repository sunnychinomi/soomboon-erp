import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserInfo } from '@/api/auth.api';

interface AuthState {
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  setAuth: (data: { user: UserInfo; accessToken: string; refreshToken: string; expiresAt: string }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      setAuth: (data) => set({ ...data }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null, expiresAt: null }),
    }),
    {
      name: 'soomboon-auth',
    }
  )
);
