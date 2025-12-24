import React from 'react';
import { Layout, Menu } from 'antd';
import { 
  DashboardOutlined, 
  PlayCircleOutlined, 
  FileTextOutlined, 
  UserOutlined, 
  SettingOutlined,
  ProjectOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@store/appStore';

const { Sider } = Layout;

const AppSidebar: React.FC = () => {
  const { sidebarCollapsed } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

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
      key: '/content',
      icon: <FileTextOutlined />,
      label: '内容生成',
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
      className="bg-white border-r border-gray-200"
      style={{
        overflow: 'auto',
        height: '100%',
        position: 'relative',
      }}
    >
      <div className="h-full bg-white">
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="border-none h-full"
        />
      </div>
    </Sider>
  );
};

export default AppSidebar;