import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, AuthTokens, Permission, ResourceType, PermissionAction } from '@university-lms/shared';

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null; // epoch ms
  setAuth: (user: AuthUser, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  hasPermission: (resource: ResourceType, action: PermissionAction) => boolean;
  hasRole: (...roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,

      setAuth: (user, tokens) =>
        set({
          user,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: Date.now() + tokens.expiresIn * 1000,
        }),

      setTokens: (tokens) =>
        set({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: Date.now() + tokens.expiresIn * 1000,
        }),

      clearAuth: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
        }),

      isAuthenticated: () => {
        const { accessToken, user } = get();
        return Boolean(accessToken && user);
      },

      hasPermission: (resource, action) => {
        const { user } = get();
        if (!user) return false;
        if (user.roles.includes('super_admin')) return true;
        return user.permissions.some(
          (p: Permission) =>
            p.resource === resource && (p.action === action || p.action === 'manage')
        );
      },

      hasRole: (...roles) => {
        const { user } = get();
        if (!user) return false;
        return roles.some((r) => user.roles.includes(r as never));
      },
    }),
    {
      name: 'ulms-auth',
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        expiresAt: s.expiresAt,
      }),
    }
  )
);
