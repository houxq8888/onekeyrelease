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
import { useAppStore } from '../../store/appStore';
import { useTranslation } from '../../hooks/useTranslation';

const { Sider } = Layout;

const AppSidebar: React.FC = () => {
  const { sidebarCollapsed, theme: appTheme } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const appTitle = (
    <div className={`flex items-center justify-center h-16 ${appTheme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
      <h1 className={`text-xl font-bold ${appTheme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>OneKeyRelease</h1>
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
      label: '内容管理',
      children: [
        {
          key: '/content',
          icon: <FileTextOutlined />,
          label: t('menu.content'),
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
      className={`fixed left-0 ${appTheme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
      style={{
        overflow: 'auto',
        height: 'calc(100vh - 64px)',
        position: 'fixed',
        left: 0,
        top: 64,
        bottom: 0,
        backgroundColor: appTheme === 'dark' ? '#141414' : '#ffffff',
        zIndex: 5,
      }}
      theme={appTheme === 'dark' ? 'dark' : 'light'}
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
            theme={appTheme === 'dark' ? 'dark' : 'light'}
          />
        </div>
      </div>
    </Sider>
  );
};

export default AppSidebar;