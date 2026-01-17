import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AppState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
  language: 'zh-CN' | 'en-US' | 'zh-TW';
  currentPage: string;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'zh-CN' | 'en-US' | 'zh-TW') => void;
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