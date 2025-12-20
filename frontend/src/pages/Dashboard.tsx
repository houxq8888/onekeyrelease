import React from 'react';
import { Card, Row, Col, Statistic, Progress, List, Typography } from 'antd';
import { 
  PlayCircleOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import { useQuery } from 'react-query';
import { apiClient } from '@utils/api';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  // 获取任务统计
  const { data: statsData } = useQuery('dashboard-stats', async () => {
    const response = await apiClient.tasks.list();
    return response.data || [];
  });

  // 获取最近任务
  const { data: recentTasks } = useQuery('recent-tasks', async () => {
    const response = await apiClient.tasks.list({ 
      page: 1, 
      pageSize: 5,
      sort: 'createdAt_desc' 
    });
    return response.data || [];
  });

  // 计算统计信息
  const stats = {
    total: statsData?.length || 0,
    running: statsData?.filter((t: any) => t.status === 'running').length || 0,
    completed: statsData?.filter((t: any) => t.status === 'completed').length || 0,
    failed: statsData?.filter((t: any) => t.status === 'failed').length || 0,
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
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="总任务数"
              value={stats.total}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="进行中"
              value={stats.running}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="已完成"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="失败"
              value={stats.failed}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ef4444' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 进度和最近任务 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
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
        
        <Col xs={24} lg={12}>
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
      </Row>

      {/* 快速操作 */}
      <Card title="快速操作">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card 
              hoverable 
              className="text-center cursor-pointer"
              onClick={() => window.location.href = '/content'}
            >
              <Title level={4}>🎨 生成内容</Title>
              <Text type="secondary">使用AI生成小红书内容</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card 
              hoverable 
              className="text-center cursor-pointer"
              onClick={() => window.location.href = '/tasks'}
            >
              <Title level={4}>🚀 创建任务</Title>
              <Text type="secondary">设置发布任务</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card 
              hoverable 
              className="text-center cursor-pointer"
              onClick={() => window.location.href = '/accounts'}
            >
              <Title level={4}>👤 管理账号</Title>
              <Text type="secondary">添加和管理小红书账号</Text>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;