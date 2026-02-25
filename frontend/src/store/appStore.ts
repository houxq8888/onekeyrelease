import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '../locales';
import type { ThemeMode } from '../theme';

interface AppState {
  sidebarCollapsed: boolean;
  theme: ThemeMode;
  language: Language;
  currentPage: string;
  toggleSidebar: () => void;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: Language) => void;
  setCurrentPage: (page: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'light',
      language: 'zh-CN',
      currentPage: '/',
      
      toggleSidebar: () => set((state) => ({ 
        sidebarCollapsed: !state.sidebarCollapsed 
      })),
      
      setTheme: (theme) => set({ theme }),
      
      setLanguage: (language) => set({ language }),
      
      setCurrentPage: (page) => set({ currentPage: page }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({ 
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        language: state.language
      }),
    }
  )
);
