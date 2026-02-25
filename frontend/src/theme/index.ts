import type { ThemeConfig } from 'antd';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  primary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  background: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  border: string;
  cardBg: string;
  headerBg: string;
  sidebarBg: string;
}

export const lightTheme: ThemeColors = {
  primary: '#1890ff',
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',
  background: '#f0f2f5',
  backgroundSecondary: '#ffffff',
  text: '#1e293b',
  textSecondary: '#64748b',
  border: '#e8e8e8',
  cardBg: '#ffffff',
  headerBg: '#ffffff',
  sidebarBg: '#ffffff',
};

export const darkTheme: ThemeColors = {
  primary: '#177ddc',
  success: '#49aa19',
  warning: '#d89614',
  error: '#a61d24',
  info: '#177ddc',
  background: '#141414',
  backgroundSecondary: '#1f1f1f',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  border: '#303030',
  cardBg: '#1f1f1f',
  headerBg: '#1f1f1f',
  sidebarBg: '#1f1f1f',
};

export const getAntdThemeConfig = (mode: ThemeMode): ThemeConfig => {
  const colors = mode === 'dark' ? darkTheme : lightTheme;
  
  return {
    token: {
      colorPrimary: colors.primary,
      colorSuccess: colors.success,
      colorWarning: colors.warning,
      colorError: colors.error,
      colorInfo: colors.info,
      colorBgContainer: colors.cardBg,
      colorText: colors.text,
      colorTextSecondary: colors.textSecondary,
      colorBorder: colors.border,
      borderRadius: 6,
    },
    algorithm: mode === 'dark' ? undefined : undefined,
    components: {
      Layout: {
        headerBg: colors.headerBg,
        siderBg: colors.sidebarBg,
        bodyBg: colors.background,
      },
      Menu: {
        itemBg: colors.sidebarBg,
        itemColor: colors.text,
        itemSelectedBg: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : '#e6f7ff',
        itemSelectedColor: colors.primary,
        itemHoverBg: mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : '#f5f5f5',
      },
      Card: {
        colorBgContainer: colors.cardBg,
      },
      Table: {
        headerBg: mode === 'dark' ? '#262626' : '#fafafa',
        rowHoverBg: mode === 'dark' ? '#262626' : '#fafafa',
      },
      Input: {
        colorBgContainer: colors.cardBg,
      },
      Select: {
        colorBgContainer: colors.cardBg,
      },
      Modal: {
        contentBg: colors.cardBg,
      },
      Drawer: {
        colorBgElevated: colors.cardBg,
      },
    },
  };
};

export const getThemeColors = (mode: ThemeMode): ThemeColors => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

export const applyThemeToDocument = (mode: ThemeMode): void => {
  const root = document.documentElement;
  const colors = getThemeColors(mode);
  
  root.setAttribute('data-theme', mode);
  
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  
  if (mode === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
};
