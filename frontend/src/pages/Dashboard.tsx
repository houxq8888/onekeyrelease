import React, { useState } from 'react';
import { Card, Row, Col, Statistic, Progress, List, Typography, Tag, Badge, Button, Modal, Form, Input, Select, message } from 'antd';
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

const { Title, Text } = Typography;
const { Option } = Select;

const Dashboard: React.FC = () => {
  const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
  const [registerForm] = Form.useForm();
  const queryClient = useQueryClient();

  // 设备注册mutation
  const registerDeviceMutation = useMutation(
    (deviceData: any) => apiClient.mobile.devices.register(deviceData),
    {
      onSuccess: () => {
        message.success('设备注册成功！');
        setIsRegisterModalVisible(false);
        registerForm.resetFields();
        // 刷新设备列表
        queryClient.invalidateQueries('mobile-devices');
        queryClient.invalidateQueries('mobile-stats');
      },
      onError: (error: any) => {
        message.error(`设备注册失败: ${error.response?.data?.message || error.message}`);
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
            activeTasks += statusResponse.data.activeTasks || 0;
            completedTasks += statusResponse.data.completedTasks || 0;
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
        <Title level={2}>仪表板</Title>
        <Text type="secondary">
          查看任务统计和最近活动
        </Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="总任务数"
              value={stats.total}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="进行中"
              value={stats.running}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="失败"
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
              title="连接设备"
              value={mobileStatsInfo.totalDevices}
              prefix={<MobileOutlined />}
              valueStyle={{ color: '#8b5cf6' }}
            />
            <div className="mt-2">
              <Tag color={mobileStatsInfo.onlineDevices > 0 ? 'green' : 'default'}>
                {mobileStatsInfo.onlineDevices > 0 ? <WifiOutlined /> : <DisconnectOutlined />}
                {mobileStatsInfo.onlineDevices} 在线
              </Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="移动端任务"
              value={mobileStatsInfo.activeTasks + mobileStatsInfo.completedTasks}
              prefix={<MessageOutlined />}
              valueStyle={{ color: '#06b6d4' }}
            />
            <div className="mt-2">
              <Text type="secondary" className="text-xs">
                活跃: {mobileStatsInfo.activeTasks} | 完成: {mobileStatsInfo.completedTasks}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 进度和最近任务 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="任务完成率">
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
                  已完成 {stats.completed} / {stats.total} 个任务
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="最近任务">
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
                          {task.status === 'completed' ? '已完成' :
                           task.status === 'failed' ? '失败' :
                           task.status === 'running' ? '进行中' : '等待中'}
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
                <span>移动端设备连接</span>
                <Button 
                  type="primary" 
                  size="small" 
                  icon={<PlusOutlined />}
                  onClick={() => {
                    registerForm.setFieldsValue({
                      deviceId: generateDeviceId(),
                      deviceName: `我的手机_${new Date().getHours()}${new Date().getMinutes()}`,
                      platform: 'android',
                      version: '1.0.0'
                    });
                    setIsRegisterModalVisible(true);
                  }}
                >
                  注册设备
                </Button>
              </div>
            }
          >
            {mobileDevices.length === 0 ? (
              <div className="text-center py-8">
                <MobileOutlined style={{ fontSize: 48, color: '#d1d5db' }} />
                <div className="mt-4">
                  <Text type="secondary">暂无连接的移动设备</Text>
                </div>
                <div className="mt-4">
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => {
                      registerForm.setFieldsValue({
                        deviceId: generateDeviceId(),
                        deviceName: `我的手机_${new Date().getHours()}${new Date().getMinutes()}`,
                        platform: 'android',
                        version: '1.0.0'
                      });
                      setIsRegisterModalVisible(true);
                    }}
                  >
                    注册新设备
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
                          <Tag color={device.isOnline ? 'green' : 'default'} size="small">
                            {device.isOnline ? '在线' : '离线'}
                          </Tag>
                        </div>
                      }
                      description={
                        <div className="space-y-1">
                          <Text type="secondary" className="block text-xs">
                            ID: {device.deviceId}
                          </Text>
                          <Text type="secondary" className="block text-xs">
                            平台: {device.platform === 'android' ? 'Android' : 'iOS'}
                          </Text>
                          <Text type="secondary" className="block text-xs">
                            最后活跃: {new Date(device.lastActiveAt).toLocaleString()}
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
      <Card title="快速操作">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={6}>
            <Card 
              hoverable 
              className="text-center cursor-pointer"
              onClick={() => window.location.href = '/content'}
            >
              <Title level={4}>🎨 生成内容</Title>
              <Text type="secondary">使用AI生成小红书内容</Text>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card 
              hoverable 
              className="text-center cursor-pointer"
              onClick={() => window.location.href = '/tasks'}
            >
              <Title level={4}>🚀 创建任务</Title>
              <Text type="secondary">设置发布任务</Text>
            </Card>
          </Col>
          <Col xs={24} sm={6}>
            <Card 
              hoverable 
              className="text-center cursor-pointer"
              onClick={() => window.location.href = '/accounts'}
            >
              <Title level={4}>👤 管理账号</Title>
              <Text type="secondary">添加和管理小红书账号</Text>
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
                  alert('当前没有在线的移动设备，请先确保移动设备已连接');
                }
              }}
            >
              <Title level={4}>📱 移动指令</Title>
              <Text type="secondary">向手机发送生成指令</Text>
              {mobileStatsInfo.onlineDevices > 0 && (
                <div className="mt-2">
                  <Tag color="green" size="small">
                    {mobileStatsInfo.onlineDevices} 设备在线
                  </Tag>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 设备注册模态框 */}
      <Modal
        title="注册移动端设备"
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
            label="设备ID"
            name="deviceId"
            rules={[{ required: true, message: '请输入设备ID' }]}
          >
            <Input placeholder="自动生成的设备唯一标识符" />
          </Form.Item>
          
          <Form.Item
            label="设备名称"
            name="deviceName"
            rules={[{ required: true, message: '请输入设备名称' }]}
          >
            <Input placeholder="例如：我的iPhone 15" />
          </Form.Item>
          
          <Form.Item
            label="平台类型"
            name="platform"
            rules={[{ required: true, message: '请选择平台类型' }]}
          >
            <Select placeholder="选择设备平台">
              <Option value="android">Android</Option>
              <Option value="ios">iOS</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            label="应用版本"
            name="version"
          >
            <Input placeholder="例如：1.0.0" />
          </Form.Item>
          
          <Form.Item>
            <div className="flex justify-end space-x-2">
              <Button onClick={() => setIsRegisterModalVisible(false)}>
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={registerDeviceMutation.isLoading}
              >
                注册设备
              </Button>
            </div>
          </Form.Item>
        </Form>
        
        <div className="mt-4 p-3 bg-blue-50 rounded">
          <Text type="secondary" className="text-xs">
            💡 提示：注册后，您需要在移动设备上使用相同的设备ID进行连接
          </Text>
        </div>
      </Modal>
    </div>
  );
};

export default Dashboard;