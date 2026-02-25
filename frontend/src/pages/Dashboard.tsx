import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Progress, List, Typography, Tag, Badge, Button, Modal, Form, Input, Select, App } from 'antd';
import { 
  PlayCircleOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined,
  MobileOutlined,
  WifiOutlined,
  DisconnectOutlined,
  MessageOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiClient } from '../utils/api';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;
const { Option } = Select;

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
  const [registerForm] = Form.useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  // 设备注册mutation
  const registerDeviceMutation = useMutation(
    (deviceData: any) => apiClient.mobile.devices.register(deviceData),
    {
      onSuccess: () => {
        message.success(t('device.registerSuccess'));
        setIsRegisterModalVisible(false);
        registerForm.resetFields();
        // 刷新设备列表
        queryClient.invalidateQueries('mobile-devices');
        queryClient.invalidateQueries('mobile-stats');
      },
      onError: (error: any) => {
        message.error(`${t('device.registerFailed', { message: error.response?.data?.message || error.message })}`);
      }
    }
  );

  // 处理设备注册
  const handleRegisterDevice = async (values: any) => {
    try {
      await registerDeviceMutation.mutateAsync({
        deviceId: values.deviceId,
        deviceName: values.deviceName,
        platform: values.platform,
        version: values.version || '1.0.0'
      });
    } catch (error) {
      console.error('设备注册错误:', error);
    }
  };

  // 生成设备ID
  const generateDeviceId = () => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `device_${timestamp}_${random}`;
  };
  // 获取任务统计
  const { data: statsData = [] } = useQuery<any[]>('dashboard-stats', async () => {
    const response = await apiClient.tasks.list();
    return Array.isArray(response.data) ? response.data : [];
  });

  // 获取最近任务
  const { data: recentTasks = [] } = useQuery<any[]>('recent-tasks', async () => {
    const response = await apiClient.tasks.list({ 
      page: 1, 
      pageSize: 5,
      sort: 'createdAt_desc' 
    });
    return Array.isArray(response.data) ? response.data : [];
  });

  // 获取移动端设备列表
  const { data: mobileDevices = [] } = useQuery<any[]>('mobile-devices', async () => {
    try {
      const response = await apiClient.mobile.devices.list();
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('获取移动端设备失败:', error);
      return [];
    }
  });

  // 获取移动端任务统计
  const { data: mobileStats = { activeTasks: 0, completedTasks: 0 } } = useQuery<any>('mobile-stats', async () => {
    try {
      const devices = mobileDevices;
      let activeTasks = 0;
      let completedTasks = 0;

      // 为每个设备获取状态
      for (const device of devices) {
        try {
          const statusResponse = await apiClient.mobile.devices.status(device.deviceId);
          if (statusResponse.data) {
            activeTasks += (statusResponse.data as any).activeTasks || 0;
            completedTasks += (statusResponse.data as any).completedTasks || 0;
          }
        } catch (error) {
          console.error(`获取设备 ${device.deviceId} 状态失败:`, error);
        }
      }

      return { activeTasks, completedTasks };
    } catch (error) {
      console.error('获取移动端统计失败:', error);
      return { activeTasks: 0, completedTasks: 0 };
    }
  }, {
    enabled: mobileDevices.length > 0
  });

  // 计算统计信息
  const stats = {
    total: statsData?.length || 0,
    running: statsData?.filter((t: any) => t.status === 'running').length || 0,
    completed: statsData?.filter((t: any) => t.status === 'completed').length || 0,
    failed: statsData?.filter((t: any) => t.status === 'failed').length || 0,
  };

  // 移动端统计
  const mobileStatsInfo = {
    totalDevices: mobileDevices.length,
    onlineDevices: mobileDevices.filter((d: any) => d.isOnline).length,
    activeTasks: mobileStats.activeTasks,
    completedTasks: mobileStats.completedTasks,
  };

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <Title level={2}>{t('menu.dashboard')}</Title>
        <Text type="secondary">
          {t('dashboard.subtitle')}
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title={t('dashboard.totalTasks')}
              value={stats.total}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title={t('dashboard.running')}
              value={stats.running}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title={t('dashboard.completed')}
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title={t('dashboard.failed')}
              value={stats.failed}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ef4444' }}
            />
          </Card>
        </Col>
        
        {/* 移动端统计卡片 */}
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title={t('dashboard.connectedDevices')}
              value={mobileStatsInfo.totalDevices}
              prefix={<MobileOutlined />}
              valueStyle={{ color: '#8b5cf6' }}
            />
            <div className="mt-2">
              <Tag color={mobileStatsInfo.onlineDevices > 0 ? 'green' : 'default'}>
                {mobileStatsInfo.onlineDevices > 0 ? <WifiOutlined /> : <DisconnectOutlined />}
                {mobileStatsInfo.onlineDevices} {t('dashboard.deviceOnline')}
              </Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title={t('dashboard.mobileTasks')}
              value={mobileStatsInfo.activeTasks + mobileStatsInfo.completedTasks}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#06b6d4' }}
            />
            <div className="mt-2">
              <Text type="secondary" className="text-xs">
                {t('dashboard.running')}: {mobileStatsInfo.activeTasks} | {t('dashboard.completed')}: {mobileStatsInfo.completedTasks}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 进度和最近任务 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title={t('dashboard.taskCompletionRate')}>
            <div className="text-center">
              <Progress
                type="circle"
                percent={Math.round(completionRate)}
                strokeColor={{
                  '0%': '#3b82f6',
                  '100%': '#10b981',
                }}
              />
              <div className="mt-4">
                <Text type="secondary">
                  {t('dashboard.completedOfTotal', { completed: stats.completed, total: stats.total })}
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title={t('dashboard.recentTasks')}>
            <List
              dataSource={recentTasks || []}
              renderItem={(task: any) => (
                <List.Item>
                  <List.Item.Meta
                    title={task.title}
                    description={
                      <div className="flex justify-between items-center">
                        <Text type="secondary">{task.description}</Text>
                        <Text 
                          type={
                            task.status === 'completed' ? 'success' : 
                            task.status === 'failed' ? 'danger' : 
                            task.status === 'running' ? 'warning' : 'secondary'
                          }
                        >
                          {task.status === 'completed' ? t('tasks.statusCompleted') :
                           task.status === 'failed' ? t('tasks.statusFailed') :
                           task.status === 'running' ? t('tasks.statusRunning') : t('tasks.statusPending')}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* 移动端设备连接状态 */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <div className="flex justify-between items-center">
                <span>{t('dashboard.mobileDeviceConnection')}</span>
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<PlusOutlined />}
                  onClick={() => {
                    registerForm.setFieldsValue({
                      deviceId: generateDeviceId(),
                      deviceName: `${t('dashboard.defaultDeviceName', { time: `${new Date().getHours()}${new Date().getMinutes()}` })}`,
                      platform: 'android',
                      version: '1.0.0'
                    });
                    setIsRegisterModalVisible(true);
                  }}
                >
                  {t('dashboard.registerDevice')}
                </Button>
              </div>
            }
          >
            {mobileDevices.length === 0 ? (
              <div className="text-center py-8">
                <MobileOutlined style={{ fontSize: 48, color: '#d1d5db' }} />
                <div className="mt-4">
                  <Text type="secondary">{t('dashboard.noMobileDevices')}</Text>
                </div>
                <div className="mt-4">
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => {
                      registerForm.setFieldsValue({
                        deviceId: generateDeviceId(),
                        deviceName: `${t('dashboard.defaultDeviceName', { time: `${new Date().getHours()}${new Date().getMinutes()}` })}`,
                        platform: 'android',
                        version: '1.0.0'
                      });
                      setIsRegisterModalVisible(true);
                    }}
                  >
                    {t('dashboard.registerNewDevice')}
                  </Button>
                </div>
              </div>
            ) : (
              <List
                dataSource={mobileDevices}
                renderItem={(device: any) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Badge 
                          status={device.isOnline ? 'success' : 'default'}
                          dot
                        >
                          <MobileOutlined style={{ fontSize: 24 }} />
                        </Badge>
                      }
                      title={
                        <div className="flex justify-between items-center">
                          <Text strong>{device.deviceName}</Text>
                          <Tag color={device.isOnline ? 'green' : 'default'}>
                            {device.isOnline ? t('dashboard.deviceOnline') : t('dashboard.deviceOffline')}
                          </Tag>
                        </div>
                      }
                      description={
                        <div className="space-y-1">
                          <Text type="secondary" className="block text-xs">
                            ID: {device.deviceId}
                          </Text>
                          <Text type="secondary" className="block text-xs">
                            {t('dashboard.platform')}: {device.platform === 'android' ? 'Android' : 'iOS'}
                          </Text>
                          <Text type="secondary" className="block text-xs">
                            {t('dashboard.lastActive')}: {new Date(device.lastActiveAt).toLocaleString()}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* 快速操作 */}
      <Card title={t('dashboard.quickActions')}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={6}>
            <Card 
              hoverable 
              className="text-center cursor-pointer"
              onClick={() => window.location.href = '/content'}
            >
              <Title level={4}>{t('dashboard.generateContent')}</Title>
              <Text type="secondary">{t('dashboard.generateContentDesc')}</Text>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card 
              hoverable 
              className="text-center cursor-pointer"
              onClick={() => window.location.href = '/tasks'}
            >
              <Title level={4}>{t('dashboard.createTask')}</Title>
              <Text type="secondary">{t('dashboard.createTaskDesc')}</Text>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card 
              hoverable 
              className="text-center cursor-pointer"
              onClick={() => window.location.href = '/accounts'}
            >
              <Title level={4}>{t('dashboard.manageAccounts')}</Title>
              <Text type="secondary">{t('dashboard.manageAccountsDesc')}</Text>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card 
              hoverable 
              className="text-center cursor-pointer"
              onClick={() => {
                // 打开移动端指令发送对话框
                if (mobileStatsInfo.onlineDevices > 0) {
                  // 如果有在线设备，跳转到移动端指令页面
                  window.location.href = '/mobile';
                } else {
                  // 如果没有在线设备，提示用户
                  message.warning(t('dashboard.noOnlineDevices'));
                }
              }}
            >
              <Title level={4}>{t('dashboard.mobileCommands')}</Title>
              <Text type="secondary">{t('dashboard.mobileCommandsDesc')}</Text>
              {mobileStatsInfo.onlineDevices > 0 && (
                <div className="mt-2">
                  <Tag color="green">
                    {t('dashboard.onlineDevices', { count: mobileStatsInfo.onlineDevices })}
                  </Tag>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 设备注册模态框 */}
      <Modal
        title={t('device.registerDeviceTitle')}
        open={isRegisterModalVisible}
        onCancel={() => setIsRegisterModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={registerForm}
          layout="vertical"
          onFinish={handleRegisterDevice}
        >
          <Form.Item
            label={t('device.deviceId')}
            name="deviceId"
            rules={[{ required: true, message: t('device.deviceIdRequired') }]}
          >
            <Input placeholder={t('device.deviceIdPlaceholder')} />
          </Form.Item>
          
          <Form.Item
            label={t('device.deviceName')}
            name="deviceName"
            rules={[{ required: true, message: t('device.deviceNameRequired') }]}
          >
            <Input placeholder={t('device.deviceNamePlaceholder')} />
          </Form.Item>
          
          <Form.Item
            label={t('device.platform')}
            name="platform"
            rules={[{ required: true, message: t('device.platformRequired') }]}
          >
            <Select placeholder={t('device.platformPlaceholder')}>
              <Option value="android">Android</Option>
              <Option value="ios">iOS</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            label={t('device.appVersion')}
            name="version"
          >
            <Input placeholder={t('device.appVersionPlaceholder')} />
          </Form.Item>
          
          <Form.Item>
            <div className="flex justify-end space-x-2">
              <Button onClick={() => setIsRegisterModalVisible(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={registerDeviceMutation.isLoading}
              >
                {t('dashboard.registerDevice')}
              </Button>
            </div>
          </Form.Item>
        </Form>
        
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <Text type="secondary" className="text-xs">
            💡 {t('device.registerTip')}
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;