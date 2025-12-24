import React from 'react';
import { Layout, Button, Dropdown, Avatar, Space } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  UserOutlined, 
  LogoutOutlined,
  SettingOutlined 
} from '@ant-design/icons';
import { useAppStore } from '@store/appStore';
import { useAuthStore } from '@store/authStore';

const { Header } = Layout;

const AppHeader: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { logout: authLogout } = useAuthStore();

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'logout':
        // 处理退出登录
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        authLogout();
        window.location.href = '/';
        break;
      case 'settings':
        window.location.href = '/settings';
        break;
      default:
        break;
    }
  };

  return (
    <Header className="bg-white shadow-sm border-b border-gray-200 px-6 flex items-center justify-between">
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
          <span className="text-gray-600">欢迎使用</span>
          <Dropdown
            menu={{ 
              items: userMenuItems, 
              onClick: handleMenuClick 
            }}
            placement="bottomRight"
          >
            <div className="flex items-center cursor-pointer hover:bg-gray-100 px-3 py-1 rounded">
              <Avatar 
                size="small" 
                icon={<UserOutlined />} 
                className="bg-primary-500"
              />
              <span className="ml-2 text-gray-700">管理员</span>
            </div>
          </Dropdown>
        </Space>
      </div>
    </Header>
  );
};

export default AppHeader;