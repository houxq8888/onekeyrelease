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
import { t } from '../../locales';

const { Sider } = Layout;

const AppSidebar: React.FC = () => {
  const { sidebarCollapsed, theme, language } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  const appTitle = (
    <div 
      className="flex items-center justify-center h-16"
      style={{ 
        borderBottom: theme === 'dark' ? '1px solid #303030' : '1px solid #e8e8e8' 
      }}
    >
      <h1 
        className="text-xl font-bold"
        style={{ color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }}
      >
        OneKeyRelease
      </h1>
    </div>
  );

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: t('sidebar.dashboard', language),
    },
    {
      key: '/tasks',
      icon: <PlayCircleOutlined />,
      label: t('sidebar.taskManagement', language),
    },
    {
      key: 'content',
      icon: <FileTextOutlined />,
      label: t('sidebar.contentManagement', language),
      children: [
        {
          key: '/content',
          icon: <FileTextOutlined />,
          label: t('sidebar.contentGeneration', language),
        },
        {
          key: '/content/history',
          icon: <HistoryOutlined />,
          label: t('sidebar.contentHistory', language),
        },
      ],
    },
    {
      key: '/templates',
      icon: <FileTextOutlined />,
      label: t('sidebar.templateLibrary', language),
    },
    {
      key: '/state-machine',
      icon: <ProjectOutlined />,
      label: t('sidebar.stateMachineEditor', language),
    },
    {
      key: '/accounts',
      icon: <UserOutlined />,
      label: t('sidebar.accountManagement', language),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: t('sidebar.systemSettings', language),
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
      className="fixed left-0"
      style={{
        overflow: 'auto',
        height: 'calc(100vh - 64px)',
        position: 'fixed',
        left: 0,
        top: 64,
        bottom: 0,
        backgroundColor: theme === 'dark' ? '#1f1f1f' : '#ffffff',
        zIndex: 5,
        borderRight: theme === 'dark' ? '1px solid #303030' : '1px solid #e8e8e8',
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
            style={{ 
              backgroundColor: theme === 'dark' ? '#1f1f1f' : '#ffffff',
            }}
          />
        </div>
      </div>
    </Sider>
  );
};

export default AppSidebar;
