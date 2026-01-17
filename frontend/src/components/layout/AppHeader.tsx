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
import { useLocaleStore } from '../../store/localeStore';

const { Header } = Layout;

const AppHeader: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar, theme } = useAppStore();
  const { logout, user } = useAuthStore();
  const { t } = useLocaleStore();

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('user.profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('menu.settings'),
    },
    {
      key: 'divider',
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('user.logout'),
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
    <Header style={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', boxShadow: '0 1px 4px rgba(0,21,41,.08)', borderBottom: theme === 'dark' ? '1px solid #334155' : '1px solid #e8e8e8', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10 }}>
      <div className="flex items-center">
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
          className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}
        />
      </div>

      <div className="flex items-center space-x-4">
        <Space>
          <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>{t('app.welcome')}</span>
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
              <span className={theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}>{user?.username || t('user.admin')}</span>
            </Button>
          </Dropdown>
        </Space>
      </div>
    </Header>
  );
};

export default AppHeader;