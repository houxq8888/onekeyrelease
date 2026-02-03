import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';
import enUS from './locales/en-US.json';

const resources = {
  'zh-CN': {
    translation: zhCN,
  },
  'zh-TW': {
    translation: zhTW,
  },
  'en-US': {
    translation: enUS,
  },
};

// 从 localStorage 获取存储的语言设置
const getStoredLanguage = (): string | null => {
  try {
    const appStorage = localStorage.getItem('app-storage');
    if (appStorage) {
      const parsed = JSON.parse(appStorage);
      return parsed.state?.language || null;
    }
  } catch (error) {
    console.error('Failed to get language from storage:', error);
  }
  return null;
};

const storedLanguage = getStoredLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: storedLanguage || 'zh-CN',
    fallbackLng: 'zh-CN',
    interpolation: {
      escapeValue: false,
    },
    // 确保语言切换时立即生效
    react: {
      useSuspense: false,
    },
  });

export default i18n;
