import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '../i18n';

export type Theme = 'light' | 'dark';
export type Language = 'zh-CN' | 'zh-TW' | 'en-US';

interface AppState {
  sidebarCollapsed: boolean;
  theme: Theme;
  language: Language;
  currentPage: string;
  toggleSidebar: () => void;
  setTheme: (theme: Theme) => void;
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

      setLanguage: (language) => {
        // 切换 i18n 语言
        i18n.changeLanguage(language);
        set({ language });
      },

      setCurrentPage: (page) => set({ currentPage: page }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        language: state.language,
      }),
    }
  )
);
