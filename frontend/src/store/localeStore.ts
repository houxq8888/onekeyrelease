import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import zhCN from '../locales/zh-CN';
import zhTW from '../locales/zh-TW';
import enUS from '../locales/en-US';

const locales = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en-US': enUS,
};

interface LocaleState {
  language: 'zh-CN' | 'zh-TW' | 'en-US';
  setLanguage: (language: 'zh-CN' | 'zh-TW' | 'en-US') => void;
  t: (key: string) => string;
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      language: 'zh-CN',
      setLanguage: (language) => set({ language }),
      t: (key: string) => {
        const { language: currentLanguage } = get();
        const locale = locales[currentLanguage];
        return locale[key] || key;
      },
    }),
    {
      name: 'locale-storage',
    }
  )
);