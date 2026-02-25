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
import { t } from '../../locales';

const { Header } = Layout;

const AppHeader: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar, theme, language } = useAppStore();
  const { logout, user } = useAuthStore();

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('header.profile', language),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('header.settings', language),
    },
    {
      key: 'divider',
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('header.logout', language),
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    switch (key) {
      case 'logout':
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
        backgroundColor: theme === 'dark' ? '#1f1f1f' : '#ffffff', 
        boxShadow: '0 1px 4px rgba(0,21,41,.08)', 
        borderBottom: theme === 'dark' ? '1px solid #303030' : '1px solid #e8e8e8', 
        padding: '0 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        height: 64, 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 10 
      }}
    >
      <div className="flex items-center">
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
          style={{ color: theme === 'dark' ? '#f1f5f9' : '#64748b' }}
        />
      </div>

      <div className="flex items-center space-x-4">
        <Space>
          <span style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
            {t('header.welcome', language)}
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
                  backgroundColor: '#1890ff',
                  marginRight: 8
                }}
              />
              <span style={{ color: theme === 'dark' ? '#f1f5f9' : '#374151' }}>
                {user?.username || '管理员'}
              </span>
            </Button>
          </Dropdown>
        </Space>
      </div>
    </Header>
  );
};

export default AppHeader;
