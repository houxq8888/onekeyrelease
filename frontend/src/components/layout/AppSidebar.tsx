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
import { useAppStore } from '@store/appStore';
import { useLocaleStore } from '@store/localeStore';

const { Sider } = Layout;

const AppSidebar: React.FC = () => {
  const { sidebarCollapsed, theme } = useAppStore();
  const { t } = useLocaleStore();
  const location = useLocation();
  const navigate = useNavigate();

  const appTitle = (
    <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">{t('app.title')}</h1>
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
      label: t('menu.content'),
      children: [
        {
          key: '/content',
          icon: <FileTextOutlined />,
          label: t('menu.content.generate'),
        },
        {
          key: '/content/history',
          icon: <HistoryOutlined />,
          label: t('menu.content.history'),
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
      label: t('menu.settings'),
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
      className="fixed left-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-gray-700"
      style={{
        overflow: 'auto',
        height: 'calc(100vh - 64px)',
        position: 'fixed',
        left: 0,
        top: 64,
        bottom: 0,
        backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
        zIndex: 5,
      }}
      theme={theme === 'dark' ? 'dark' : 'light'}
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
            theme={theme === 'dark' ? 'dark' : 'light'}
          />
        </div>
      </div>
    </Sider>
  );
};

export default AppSidebar;