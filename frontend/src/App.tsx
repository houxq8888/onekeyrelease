import React, { useEffect, useState, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Layout, App as AntdApp, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import { useTranslation } from 'react-i18next';
import AppHeader from './components/layout/AppHeader';
import AppSidebar from './components/layout/AppSidebar';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import ContentGenerator from './pages/ContentGenerator';
import ContentHistory from './pages/ContentHistory';
import Accounts from './pages/Accounts';
import Settings from './pages/Settings';
import StateMachineEditor from './pages/StateMachineEditor';
import TemplatesLibrary from './pages/TemplatesLibrary';
import { useAppStore } from './store/appStore';
import { useAuthStore } from './store/authStore';

const { Content } = Layout;

// 主题配置
const lightTheme = {
  token: {
    colorPrimary: '#0ea5e9',
    borderRadius: 8,
    fontSize: 14,
    colorBgBase: '#ffffff',
    colorTextBase: '#1e293b',
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f0f2f5',
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',
  },
  algorithm: antdTheme.defaultAlgorithm,
};

const darkTheme = {
  token: {
    colorPrimary: '#0ea5e9',
    borderRadius: 8,
    fontSize: 14,
    colorBgBase: '#141414',
    colorTextBase: '#e5e7eb',
    colorBgContainer: '#1f1f1f',
    colorBgLayout: '#000000',
    colorBorder: '#434343',
    colorBorderSecondary: '#303030',
  },
  algorithm: antdTheme.darkAlgorithm,
};

// Ant Design 语言包映射
const antdLocales: Record<string, any> = {
  'zh-CN': zhCN,
  'zh-TW': zhCN, // Ant Design 没有繁体中文，使用简体中文作为回退
  'en-US': enUS,
};

const App: React.FC = () => {
  const { sidebarCollapsed, theme, language } = useAppStore();
  const { isAuthenticated, token, user, login } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { i18n } = useTranslation();

  console.log('App组件认证状态:', { isAuthenticated, token, user });

  // 同步语言设置
  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  // 同步主题设置到 document.body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    console.log('主题切换为:', theme);
  }, [theme]);

  // 演示版本：直接设置认证状态，跳过登录验证
  useEffect(() => {
    const setupDemoAuth = async () => {
      try {
        // 如果当前未认证，则设置演示用户
        if (!isAuthenticated || !token) {
          console.log('设置演示版本认证状态...');

          // 创建演示用户信息
          const demoUser = {
            id: 'demo-user-id',
            username: '演示用户',
            email: 'demo@example.com',
            role: 'admin'
          };

          // 设置演示token和用户信息
          login('demo-token', demoUser);
          console.log('演示版本认证设置完成');
        }
      } catch (error) {
        console.error('设置演示认证时出错:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    setupDemoAuth();
  }, [isAuthenticated, token, login]);

  // 根据主题获取配置
  const themeConfig = useMemo(() => {
    return theme === 'dark' ? darkTheme : lightTheme;
  }, [theme]);

  // 获取 Ant Design 语言包
  const antdLocale = useMemo(() => {
    return antdLocales[language] || zhCN;
  }, [language]);

  // 如果正在检查认证状态，显示加载中
  if (isCheckingAuth) {
    return (
      <ConfigProvider locale={antdLocale} theme={themeConfig}>
        <AntdApp>
          <div
            className="min-h-screen flex items-center justify-center"
            style={{
              backgroundColor: theme === 'dark' ? '#000000' : '#f0f2f5',
            }}
          >
            <div className="text-center">
              <div
                className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
                style={{
                  borderColor: theme === 'dark' ? '#0ea5e9' : '#0ea5e9',
                }}
              ></div>
              <p
                className="mt-4"
                style={{
                  color: theme === 'dark' ? '#e5e7eb' : '#4b5563',
                }}
              >
                初始化演示版本...
              </p>
            </div>
          </div>
        </AntdApp>
      </ConfigProvider>
    );
  }

  // 演示版本：直接进入主界面，跳过登录页面
  console.log('演示版本，直接进入主界面');

  return (
    <ConfigProvider locale={antdLocale} theme={themeConfig}>
      <AntdApp>
        <Layout
          style={{
            minHeight: '100vh',
            background: theme === 'dark' ? '#000000' : '#ffffff',
          }}
        >
          <AppHeader />
          <Layout
            style={{
              background: theme === 'dark' ? '#141414' : '#f0f2f5',
              minHeight: 'calc(100vh - 64px)',
            }}
          >
            <AppSidebar />
            <Layout
              className="transition-all duration-200"
              style={{
                marginLeft: sidebarCollapsed ? 80 : 200,
                background: theme === 'dark' ? '#141414' : '#f0f2f5',
                minHeight: 'calc(100vh - 64px)',
              }}
            >
              <Content
                className="p-6"
                style={{
                  minHeight: 'calc(100vh - 64px)',
                  background: theme === 'dark' ? '#141414' : '#f0f2f5',
                }}
              >
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/content" element={<ContentGenerator />} />
                  <Route path="/content/history" element={<ContentHistory />} />
                  <Route path="/templates" element={<TemplatesLibrary />} />
                  <Route path="/accounts" element={<Accounts />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/state-machine" element={<StateMachineEditor />} />
                  <Route path="/auth" element={<Navigate to="/" replace />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Content>
            </Layout>
          </Layout>
        </Layout>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;
