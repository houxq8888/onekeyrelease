import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Layout, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AppHeader from './components/layout/AppHeader';
import AppSidebar from './components/layout/AppSidebar';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import ContentGenerator from './pages/ContentGenerator';
import ContentHistory from './pages/ContentHistory';
import Accounts from './pages/Accounts';
import Settings from './pages/Settings';
import StateMachineEditor from './pages/StateMachineEditor';
import TemplateLibrary from './pages/TemplateLibrary';
import { useAppStore } from './store/appStore';
import { useAuthStore } from './store/authStore';


const { Content } = Layout;

const App: React.FC = () => {
  const { sidebarCollapsed } = useAppStore();
  const { isAuthenticated, token, user, login } = useAuthStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

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
    <ConfigProvider locale={zhCN}>
        <AntdApp>
          <Layout style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
            <AppHeader />
            <Layout style={{ backgroundColor: '#f0f2f5', minHeight: 'calc(100vh - 64px)' }}>
              <AppSidebar />
              <Layout 
                className="transition-all duration-200" 
                style={{ 
                  marginLeft: sidebarCollapsed ? 80 : 200,
                  backgroundColor: '#f0f2f5',
                  minHeight: 'calc(100vh - 64px)'
                }}
              >
                <Content className="p-6" style={{ minHeight: 'calc(100vh - 64px)' }}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/content" element={<ContentGenerator />} />
                    <Route path="/content/history" element={<ContentHistory />} />
                    <Route path="/templates" element={<TemplateLibrary />} />
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