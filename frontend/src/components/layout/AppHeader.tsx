import React from 'react';
import { Layout, Button, Avatar, Space } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  UserOutlined, 
  LogoutOutlined
} from '@ant-design/icons';
import { useAppStore } from '@store/appStore';
import { useAuthStore } from '@store/authStore';

const { Header } = Layout;

const AppHeader: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <Header className="bg-white shadow-sm border-b border-gray-200 px-6 flex items-center justify-between h-16 z-20">
      <div className="flex items-center">
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
          className="text-gray-600"
        />
        <div className="ml-4">
          <h1 className="text-xl font-semibold text-gray-800">OneKeyRelease</h1>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Space>
          <div className="flex items-center">
            <Avatar 
              size="small" 
              icon={<UserOutlined />} 
              className="bg-blue-500"
            />
            <span className="ml-2 text-gray-700 font-medium">{user?.username || '管理员'}</span>
          </div>
          <Button
            type="default"
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            className="ml-4"
          >
            退出登录
          </Button>
        </Space>
      </div>
    </Header>
  );
};

export default AppHeader;