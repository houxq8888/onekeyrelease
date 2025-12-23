import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: {
    id: string;
    username: string;
    email: string;
    role: string;
  } | null;
  isAuthenticated: boolean;
  login: (token: string, user: AuthState['user']) => void;
  logout: () => void;
  updateUser: (user: Partial<AuthState['user']>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: (token: string, user: AuthState['user']) => {
        console.log('authStore.login called', { token, user });
        set({
          token,
          user,
          isAuthenticated: true,
        });
        console.log('Login successful, state updated');
      },

      logout: () => {
        console.log('authStore.logout called');
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },

      updateUser: (userData: Partial<AuthState['user']>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
    } 
  )
);