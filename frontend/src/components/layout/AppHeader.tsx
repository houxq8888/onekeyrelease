import React from 'react';
import { Layout, Button, Dropdown, Avatar, Space } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  UserOutlined, 
  LogoutOutlined,
  SettingOutlined 
} from '@ant-design/icons';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';

const { Header } = Layout;

const AppHeader: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { logout, user } = useAuthStore();

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
      key: 'divider',
      type: 'divider' as const,
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
        logout();
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
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
    <Header style={{ backgroundColor: '#ffffff', boxShadow: '0 1px 4px rgba(0,21,41,.08)', borderBottom: '1px solid #e8e8e8', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10 }}>
      <div className="flex items-center">
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
          className="text-gray-600"
        />
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
            <Button type="text" className="flex items-center">
              <Avatar 
                size="small" 
                icon={<UserOutlined />} 
                className="bg-primary-500 mr-2"
              />
              <span className="text-gray-700">{user?.username || '管理员'}</span>
            </Button>
          </Dropdown>
        </Space>
      </div>
    </Header>
  );
};

export default AppHeader;