import React from 'react';
import { Layout, Button, Dropdown, Avatar, Space } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';

const { Header } = Layout;

const AppHeader: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar, theme } = useAppStore();
  const { logout, user } = useAuthStore();
  const { t } = useTranslation();

  const isDark = theme === 'dark';

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('auth.username'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('nav.settings'),
    },
    {
      key: 'divider',
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('auth.logout'),
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
    <Header
      style={{
        backgroundColor: isDark ? '#141414' : '#ffffff',
        boxShadow: isDark ? '0 1px 4px rgba(0,0,0,.3)' : '0 1px 4px rgba(0,21,41,.08)',
        borderBottom: isDark ? '1px solid #303030' : '1px solid #e8e8e8',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
      }}
    >
      <div className="flex items-center">
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
          style={{
            color: isDark ? '#e5e7eb' : '#4b5563',
          }}
        />
      </div>

      <div className="flex items-center space-x-4">
        <Space>
          <span style={{ color: isDark ? '#e5e7eb' : '#4b5563' }}>
            {t('common.welcome') || 'Welcome'}
          </span>
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
                style={{
                  backgroundColor: '#0ea5e9',
                  marginRight: 8,
                }}
              />
              <span style={{ color: isDark ? '#e5e7eb' : '#374151' }}>
                {user?.username || 'Admin'}
              </span>
            </Button>
          </Dropdown>
        </Space>
      </div>
    </Header>
  );
};

export default AppHeader;
