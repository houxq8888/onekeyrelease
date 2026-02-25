import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN.json';
import zhTW from './locales/zh-TW.json';
import enUS from './locales/en-US.json';

const resources = {
  'zh-CN': {
    translation: zhCN
  },
  'zh-TW': {
    translation: zhTW
  },
  'en-US': {
    translation: enUS
  }
};

// 从 localStorage 获取保存的语言设置
const getSavedLanguage = () => {
  try {
    const appStorage = localStorage.getItem('app-storage');
    if (appStorage) {
      const parsed = JSON.parse(appStorage);
      return parsed.state?.language;
    }
  } catch (error) {
    console.error('Failed to get language from storage:', error);
  }
  return 'zh-CN';
};

const savedLanguage = getSavedLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: savedLanguage, // 使用保存的语言
    fallbackLng: 'zh-CN',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
