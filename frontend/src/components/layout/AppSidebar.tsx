import React from 'react';
import { Layout, Menu, theme } from 'antd';
import { 
  DashboardOutlined, 
  PlayCircleOutlined, 
  FileTextOutlined, 
  UserOutlined, 
  SettingOutlined,
  ProjectOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@store/appStore';

const { Sider } = Layout;
const { useToken } = theme;

const AppSidebar: React.FC = () => {
  const { sidebarCollapsed } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useToken();
  const { t } = useTranslation();

  const appTitle = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 64, borderBottom: `1px solid ${token.colorBorder}` }}>
      <h1 style={{ fontSize: 20, fontWeight: 'bold', color: token.colorText }}>OneKeyRelease</h1>
    </div>
  );

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: t('menu.dashboard'),
    },
    {
      key: '/tasks',
      icon: <PlayCircleOutlined />,
      label: t('menu.tasks'),
    },
    {
      key: 'content',
      icon: <FileTextOutlined />,
      label: t('menu.contentManagement'),
      children: [
        {
          key: '/content',
          icon: <FileTextOutlined />,
          label: t('menu.contentGenerator'),
        },
        {
          key: '/content/history',
          icon: <HistoryOutlined />,
          label: t('menu.contentHistory'),
        },
      ],
    },
    {
      key: '/templates',
      icon: <FileTextOutlined />,
      label: t('menu.templates'),
    },
    {
      key: '/state-machine',
      icon: <ProjectOutlined />,
      label: t('menu.stateMachine'),
    },
    {
      key: '/accounts',
      icon: <UserOutlined />,
      label: t('menu.accounts'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: t('menu.systemSettings'),
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  return (
    <Sider 
      trigger={null} 
      collapsible 
      collapsed={sidebarCollapsed}
      style={{
        overflow: 'auto',
        height: 'calc(100vh - 64px)',
        position: 'fixed',
        left: 0,
        top: 64,
        bottom: 0,
        backgroundColor: token.colorBgContainer,
        borderRight: `1px solid ${token.colorBorder}`,
        zIndex: 5,
      }}
      theme="light"
    >
      <div className="h-full flex flex-col">
        {!sidebarCollapsed && appTitle}
        <div className="flex-1">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            className="border-none"
          />
        </div>
      </div>
    </Sider>
  );
};

export default AppSidebar;