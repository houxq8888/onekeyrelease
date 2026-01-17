import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  message,
  Card,
  Typography 
} from 'antd';
import { 
  PlusOutlined, 
  PlayCircleOutlined, 
  EditOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiClient } from '../utils/api';
import type { Task } from '../types';

const { Title } = Typography;
const { Option } = Select;

const Tasks: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // 获取任务列表
  const { data: tasks = [], isLoading, refetch } = useQuery<Task[]>('tasks', async () => {
    try {
      console.log('Tasks组件 - 开始获取任务列表');
      const response = await apiClient.tasks.list();
      console.log('Tasks组件 - 获取任务列表成功，原始响应:', response);
      if (response && response.success && response.data) {
        // 转换数据格式，将_id转换为id
        const tasksData = Array.isArray(response.data) ? response.data : [];
        const transformedTasks = tasksData.map((task: any) => ({
          ...task,
          id: task._id || task.id,
          status: task.status || 'pending',
          type: task.type || 'content_generation',
        }));
        console.log('Tasks组件 - 转换后的任务列表:', transformedTasks);
        return transformedTasks;
      }
      console.warn('Tasks组件 - 响应格式不正确:', response);
      return [];
    } catch (error) {
      console.error('Tasks组件 - 获取任务列表失败:', error);
      return [];
    }
  }, {
    refetchOnWindowFocus: false,
    retry: 1
  });

  console.log('Tasks组件 - 当前任务列表:', tasks);

  // 创建任务
  const createMutation = useMutation(async (values: any) => {
    console.log('Tasks组件 - 开始创建任务，表单值:', values);
    try {
      // 构建任务数据（符合ITaskInput格式）
      const taskData = {
        title: values.title,
        description: values.description,
        type: values.type || 'content_generation',
        config: {
          contentConfig: {
            theme: values.title, // 使用标题作为主题
            keywords: [],
            targetAudience: 'general',
            style: 'casual',
            wordCount: 500,
          },
        },
      };
      console.log('Tasks组件 - 构建的任务数据:', taskData);
      const response = await apiClient.tasks.create(taskData);
      console.log('Tasks组件 - 任务创建成功，响应:', response);
      return response;
    } catch (error) {
      console.error('Tasks组件 - 任务创建失败，错误:', error);
      throw error;
    }
  }, {
    onSuccess: (response) => {
      console.log('Tasks组件 - 任务创建成功，响应:', response);
      message.success('任务创建成功');
      setIsModalVisible(false);
      form.resetFields();
      // 立即重新获取任务列表
      refetch();
    },
    onError: (error: any) => {
      console.error('Tasks组件 - 任务创建失败，错误:', error);
      message.error(error.response?.data?.error || error.message || '创建任务失败');
    },
  });

  console.log('Tasks组件 - 表单值:', form.getFieldsValue());
  console.log('Tasks组件 - 创建任务loading:', createMutation.isLoading);

  // 启动任务
  const startMutation = useMutation(
    (id: string) => apiClient.tasks.start(id),
    {
      onSuccess: () => {
        message.success('任务已启动');
        queryClient.invalidateQueries('tasks');
      },
      onError: (error: any) => {
        message.error(error.response?.data?.error || '启动任务失败');
      },
    }
  );

  // 删除任务
  const deleteMutation = useMutation(
    (id: string) => apiClient.tasks.delete(id),
    {
      onSuccess: () => {
        message.success('任务删除成功');
        queryClient.invalidateQueries('tasks');
      },
      onError: (error: any) => {
        message.error(error.response?.data?.error || '删除任务失败');
      },
    }
  );

  const handleCreateTask = (values: any) => {
    createMutation.mutate(values);
  };

  const handleStartTask = (id: string) => {
    startMutation.mutate(id);
  };

  const handleDeleteTask = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个任务吗？',
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          pending: { color: 'default', text: '等待中' },
          running: { color: 'processing', text: '进行中' },
          completed: { color: 'success', text: '已完成' },
          failed: { color: 'error', text: '失败' },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeText = {
          content_generation: '内容生成',
          publish: '发布',
          both: '生成并发布',
        };
        return typeText[type as keyof typeof typeText] || type;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Task) => (
        <Space size="middle">
          {record.status === 'pending' && (
            <Button
              type="link"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStartTask(record.id)}
            >
              启动
            </Button>
          )}
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingTask(record);
              setIsModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTask(record.id)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <Title level={2}>任务管理</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingTask(null);
            setIsModalVisible(true);
          }}
        >
          新建任务
        </Button>
      </div>

      {/* 任务列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
          }}
        />
      </Card>

      {/* 创建/编辑任务模态框 */}
      <Modal
        title={editingTask ? '编辑任务' : '新建任务'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateTask}
          initialValues={editingTask || {
            type: 'both',
          }}
        >
          <Form.Item
            name="title"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="请输入任务名称" />
          </Form.Item>

          <Form.Item
            name="description"
            label="任务描述"
          >
            <Input.TextArea 
              placeholder="请输入任务描述"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="type"
            label="任务类型"
            rules={[{ required: true, message: '请选择任务类型' }]}
          >
            <Select placeholder="请选择任务类型">
              <Option value="content_generation">内容生成</Option>
              <Option value="publish">发布</Option>
              <Option value="both">生成并发布</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="publishTime"
            label="发布时间"
          >
            <DatePicker
              showTime
              placeholder="选择发布时间"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={createMutation.isLoading}
              >
                {editingTask ? '更新' : '创建'}
              </Button>
              <Button 
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Tasks;