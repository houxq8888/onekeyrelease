import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Layout, App as AntdApp, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import enUS from 'antd/locale/en_US';
import zhTW from 'antd/locale/zh_TW';
const { darkAlgorithm, defaultAlgorithm } = theme;
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

const App: React.FC = () => {
  const { sidebarCollapsed, theme, language } = useAppStore();
  const { isAuthenticated, token, user, login } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  console.log('App组件认证状态:', { isAuthenticated, token, user });

  // 主题切换
  useEffect(() => {
    console.log('App组件 - 主题变更:', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      console.log('App组件 - 已添加dark类');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('App组件 - 已移除dark类');
    }
    // 强制刷新ConfigProvider以应用主题
    setConfigKey(prev => prev + 1);
  }, [theme]);

  // 语言切换 - 添加额外的key来强制重新渲染ConfigProvider
  const [configKey, setConfigKey] = useState(0);

  // 语言切换
  const getLocale = () => {
    console.log('App组件 - 获取语言配置:', language);
    switch (language) {
      case 'en-US':
        return enUS;
      case 'zh-TW':
        return zhTW;
      default:
        return zhCN;
    }
  };

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

  // 如果正在检查认证状态，显示加载中
  if (isCheckingAuth) {
    return (
      <ConfigProvider locale={zhCN}>
        <AntdApp>
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">初始化演示版本...</p>
            </div>
          </div>
        </AntdApp>
      </ConfigProvider>
    );
  }

  // 演示版本：直接进入主界面，跳过登录页面
  console.log('演示版本，直接进入主界面');

  return (
    <ConfigProvider key={`config-${configKey}`} locale={getLocale()} theme={{ algorithm: theme === 'dark' ? darkAlgorithm : defaultAlgorithm }}>
        <AntdApp>
          <Layout className="min-h-screen dark:bg-gray-900">
            <AppHeader />
            <Layout className="min-h-[calc(100vh-64px)] dark:bg-gray-800">
              <AppSidebar />
              <Layout 
                className="transition-all duration-200 dark:bg-gray-800"
                style={{ marginLeft: sidebarCollapsed ? 80 : 200 }}
              >
                <Content className="p-6 dark:bg-gray-800 min-h-[calc(100vh-64px)]">
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