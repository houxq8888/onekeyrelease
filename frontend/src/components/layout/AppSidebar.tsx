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

const { Sider } = Layout;

const AppSidebar: React.FC = () => {
  const { sidebarCollapsed } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  const appTitle = (
    <div className="flex items-center justify-center h-16 border-b border-gray-200">
      <h1 className="text-xl font-bold text-gray-800">OneKeyRelease</h1>
    </div>
  );

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '仪表板',
    },
    {
      key: '/tasks',
      icon: <PlayCircleOutlined />,
      label: '任务管理',
    },
    {
      key: 'content',
      icon: <FileTextOutlined />,
      label: '内容管理',
      children: [
        {
          key: '/content',
          icon: <FileTextOutlined />,
          label: '内容生成',
        },
        {
          key: '/content/history',
          icon: <HistoryOutlined />,
          label: '历史内容',
        },
      ],
    },
    {
      key: '/state-machine',
      icon: <ProjectOutlined />,
      label: '状态机编辑器',
    },
    {
      key: '/accounts',
      icon: <UserOutlined />,
      label: '账号管理',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
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
      className="fixed left-0 bg-white border-r border-gray-200"
      style={{
        overflow: 'auto',
        height: 'calc(100vh - 64px)',
        position: 'fixed',
        left: 0,
        top: 64,
        bottom: 0,
        backgroundColor: '#ffffff',
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