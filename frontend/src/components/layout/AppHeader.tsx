import React from 'react';
import { Layout, Button, Dropdown, Avatar, Space, theme } from 'antd';
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
const { useToken } = theme;

const AppHeader: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { logout, user } = useAuthStore();
  const { token } = useToken();
  const { t } = useTranslation();

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('common.profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('common.settings'),
    },
    {
      key: 'divider',
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('common.logout'),
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
    <Header style={{ backgroundColor: token.colorBgContainer, boxShadow: '0 1px 4px rgba(0,21,41,.08)', borderBottom: `1px solid ${token.colorBorder}`, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10 }}>
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
          <span className="text-gray-600">{t('common.welcomeUse')}</span>
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
              <span className="text-gray-700">{user?.username || t('app.admin')}</span>
            </Button>
          </Dropdown>
        </Space>
      </div>
    </Header>
  );
};

export default AppHeader;