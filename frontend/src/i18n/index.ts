import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from '../locales/zh-CN/translation.json';
import zhTW from '../locales/zh-TW/translation.json';
import enUS from '../locales/en-US/translation.json';

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

const storedLanguage = localStorage.getItem('language') || 'zh-CN';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: storedLanguage,
    fallbackLng: 'zh-CN',
    interpolation: {
      escapeValue: false,
    },
    debug: false,
  });

export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
};

export default i18n;
