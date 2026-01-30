import { useAppStore } from '../store/appStore';
import { translations } from '../locales';

export const useTranslation = () => {
  const { language } = useAppStore();
  
  const t = (key: string, params?: Record<string, any>) => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // 如果当前语言没有找到翻译，尝试使用简体中文作为默认
        value = translations['zh-CN'];
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            // 如果还是找不到，返回原始key
            return key;
          }
        }
        break;
      }
    }
    
    let result = typeof value === 'string' ? value : key;
    
    // 如果有参数，替换模板中的占位符
    if (params && typeof result === 'string') {
      for (const [param, paramValue] of Object.entries(params)) {
        result = result.replace(new RegExp(`{${param}}`, 'g'), String(paramValue));
      }
    }
    
    return result;
  };
  
  return { t, language };
};