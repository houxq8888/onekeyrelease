import React from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  UserOutlined,
  SettingOutlined,
  ProjectOutlined,
  HistoryOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/appStore';

const { Sider } = Layout;

const AppSidebar: React.FC = () => {
  const { sidebarCollapsed, theme } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isDark = theme === 'dark';

  const appTitle = (
    <div
      className="flex items-center justify-center h-16 border-b"
      style={{
        borderColor: isDark ? '#303030' : '#e5e7eb',
      }}
    >
      <h1
        className="text-xl font-bold"
        style={{
          color: isDark ? '#e5e7eb' : '#1f2937',
        }}
      >
        OneKeyRelease
      </h1>
    </div>
  );

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: t('nav.dashboard'),
    },
    {
      key: '/tasks',
      icon: <PlayCircleOutlined />,
      label: t('nav.tasks'),
    },
    {
      key: 'content',
      icon: <FileTextOutlined />,
      label: t('nav.content'),
      children: [
        {
          key: '/content',
          icon: <FileTextOutlined />,
          label: t('nav.content'),
        },
        {
          key: '/content/history',
          icon: <HistoryOutlined />,
          label: t('nav.contentHistory'),
        },
      ],
    },
    {
      key: '/templates',
      icon: <FileTextOutlined />,
      label: t('nav.templates'),
    },
    {
      key: '/state-machine',
      icon: <ProjectOutlined />,
      label: t('nav.stateMachine'),
    },
    {
      key: '/accounts',
      icon: <UserOutlined />,
      label: t('nav.accounts'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: t('nav.settings'),
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
      className="fixed left-0 border-r"
      style={{
        overflow: 'auto',
        height: 'calc(100vh - 64px)',
        position: 'fixed',
        left: 0,
        top: 64,
        bottom: 0,
        backgroundColor: isDark ? '#141414' : '#ffffff',
        borderColor: isDark ? '#303030' : '#e5e7eb',
        zIndex: 5,
      }}
      theme={isDark ? 'dark' : 'light'}
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
            theme={isDark ? 'dark' : 'light'}
            style={{
              backgroundColor: isDark ? '#141414' : '#ffffff',
            }}
          />
        </div>
      </div>
    </Sider>
  );
};

export default AppSidebar;
