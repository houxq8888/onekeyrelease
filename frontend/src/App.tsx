import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Layout, Spin, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { QueryClient, QueryClientProvider } from 'react-query';
import AppHeader from '@components/layout/AppHeader';
import AppSidebar from '@components/layout/AppSidebar';
import Auth from '@pages/Auth';
import Dashboard from '@pages/Dashboard';
import Tasks from '@pages/Tasks';
import ContentGenerator from '@pages/ContentGenerator';
import Accounts from '@pages/Accounts';
import Settings from '@pages/Settings';
import StateMachineEditor from '@pages/StateMachineEditor';
import { useAppStore } from '@store/appStore';
import { useAuthStore } from '@store/authStore';
import { apiClient } from '@utils/api';

const { Content } = Layout;

// 创建React Query客户端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5分钟
    },
  },
});

const App: React.FC = () => {
  const { sidebarCollapsed } = useAppStore();
  const { isAuthenticated, login, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);

  // 检查认证状态
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
          const user = JSON.parse(userStr);
          login(token, user);
        }
      } catch (error) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [login, logout]);

  // 显示加载状态
  if (loading) {
    return (
      <ConfigProvider locale={zhCN}>
        <AntdApp>
          <div className="min-h-screen flex items-center justify-center">
            <Spin size="large" tip="加载中..." fullscreen />
          </div>
        </AntdApp>
      </ConfigProvider>
    );
  }

  // 如果未认证，显示登录页面
  if (!isAuthenticated) {
    return (
      <ConfigProvider locale={zhCN}>
        <QueryClientProvider client={queryClient}>
          <AntdApp>
            <Auth />
          </AntdApp>
        </QueryClientProvider>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider locale={zhCN}>
      <QueryClientProvider client={queryClient}>
        <AntdApp>
          <Layout style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
            <AppHeader />
            <Layout style={{ backgroundColor: '#f0f2f5' }}>
              <AppSidebar />
              <Layout 
                className="transition-all duration-200" 
                style={{ 
                  marginLeft: sidebarCollapsed ? 80 : 200,
                  marginTop: 64,
                  backgroundColor: '#f0f2f5'
                }}
              >
                <Content className="p-6">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/content" element={<ContentGenerator />} />
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
      </QueryClientProvider>
    </ConfigProvider>
  );
};

export default App;