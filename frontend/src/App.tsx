import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Layout, App as AntdApp, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import zhTW from 'antd/locale/zh_TW';
import enUS from 'antd/locale/en_US';
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
import './index.css';


const { Content } = Layout;

const App: React.FC = () => {
  const { sidebarCollapsed, theme: appTheme, language } = useAppStore();
  const { isAuthenticated, token, user, login } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const localeMap: Record<string, any> = {
    'zh-CN': zhCN,
    'zh-TW': zhTW,
    'en-US': enUS,
  };

  const currentLocale = localeMap[language] || zhCN;
  const currentAlgorithm = appTheme === 'dark' ? theme.darkAlgorithm : theme.defaultAlgorithm;
  
  console.log('App组件渲染 - 主题:', appTheme, '语言:', language, '算法类型:', appTheme === 'dark' ? 'darkAlgorithm' : 'defaultAlgorithm');

  useEffect(() => {
    console.log('主题切换:', appTheme);
  }, [appTheme]);

  useEffect(() => {
    console.log('语言切换:', language);
  }, [language]);

  console.log('App组件认证状态:', { isAuthenticated, token, user });

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

  // 如果正在检查认证状态，显示加载中
  if (isCheckingAuth) {
    return (
      <ConfigProvider locale={currentLocale}>
        <AntdApp>
          <div className={appTheme === 'dark' ? 'min-h-screen flex items-center justify-center bg-gray-900' : 'min-h-screen flex items-center justify-center bg-gray-50'}>
            <div className="text-center">
              <div className={appTheme === 'dark' ? 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto' : 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto'}></div>
              <p className={appTheme === 'dark' ? 'mt-4 text-gray-300' : 'mt-4 text-gray-600'}>初始化演示版本...</p>
            </div>
          </div>
        </AntdApp>
      </ConfigProvider>
    );
  }

  // 演示版本：直接进入主界面，跳过登录页面
  console.log('演示版本，直接进入主界面');

  return (
    <ConfigProvider 
      locale={currentLocale}
      theme={{
        algorithm: currentAlgorithm,
      }}
    >
        <AntdApp>
          <Layout className={appTheme === 'dark' ? 'dark-theme' : ''} style={{ minHeight: '100vh' }}>
            <AppHeader />
            <Layout style={{ minHeight: 'calc(100vh - 64px)' }}>
              <AppSidebar />
              <Layout 
                className="transition-all duration-200" 
                style={{ 
                  marginLeft: sidebarCollapsed ? 80 : 200,
                  minHeight: 'calc(100vh - 64px)'
                }}
              >
                <Content className="p-6" style={{ minHeight: 'calc(100vh - 64px)' }}>
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