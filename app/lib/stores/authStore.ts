import { map } from 'nanostores';
import type { User } from '~/types/backend';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const authStore = map<AuthState>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
});

export function setAuth(token: string, user: User) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  authStore.set({ user, token, isAuthenticated: true, isLoading: false });
}

export function clearAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  authStore.set({ user: null, token: null, isAuthenticated: false, isLoading: false });
}

export function initAuth() {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        authStore.set({ user, token, isAuthenticated: true, isLoading: false });
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
        clearAuth();
      }
    } else {
      authStore.set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }
}

export function getAuthToken(): string | null {
  return authStore.get().token;
}

export function isAuthenticated(): boolean {
  return authStore.get().isAuthenticated;
}

export function getCurrentUser() {
  return authStore.get().user;
}
