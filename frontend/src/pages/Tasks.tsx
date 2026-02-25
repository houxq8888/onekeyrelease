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
  App,
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
import { useTranslation } from 'react-i18next';
import { apiClient } from '../utils/api';
import type { Task } from '../types';

const { Title } = Typography;
const { Option } = Select;

const Tasks: React.FC = () => {
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  // 获取任务列表
  const { data: tasks = [], isLoading } = useQuery<Task[]>('tasks', async () => {
    const response = await apiClient.tasks.list();
    const result = response.data as any;
    let tasksData: any[] = [];
    if (result && typeof result === 'object' && 'tasks' in result) {
      tasksData = Array.isArray(result.tasks) ? result.tasks : [];
    } else if (Array.isArray(result)) {
      tasksData = result;
    }
    return tasksData.map((task: any) => ({
      ...task,
      id: task.id || task._id
    }));
  });

  // 创建任务
  const createMutation = useMutation(apiClient.tasks.create, {
    onSuccess: () => {
      message.success(t('tasks.createSuccess'));
      setIsModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries('tasks');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || t('tasks.createFailed'));
    },
  });

  // 启动任务
  const startMutation = useMutation(
    (id: string) => apiClient.tasks.start(id),
    {
      onSuccess: () => {
        message.success(t('tasks.startSuccess'));
        queryClient.invalidateQueries('tasks');
      },
      onError: (error: any) => {
        message.error(error.response?.data?.error || t('tasks.startFailed'));
      },
    }
  );

  // 删除任务
  const deleteMutation = useMutation(
    (id: string) => apiClient.tasks.delete(id),
    {
      onSuccess: () => {
        message.success(t('tasks.deleteSuccess'));
        queryClient.invalidateQueries('tasks');
      },
      onError: (error: any) => {
        message.error(error.response?.data?.error || t('tasks.deleteFailed'));
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
      title: t('common.confirmDelete'),
      content: t('tasks.confirmDeleteContent'),
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const columns = [
    {
      title: t('tasks.taskName'),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: t('tasks.description'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('tasks.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          pending: { color: 'default', text: t('tasks.statusPending') },
          running: { color: 'processing', text: t('tasks.statusRunning') },
          completed: { color: 'success', text: t('tasks.statusCompleted') },
          failed: { color: 'error', text: t('tasks.statusFailed') },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: t('tasks.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeText: Record<string, string> = {
          content_generation: t('tasks.typeContentGeneration'),
          content_publish: t('tasks.typeContentPublish'),
          batch: t('tasks.typeBatch'),
        };
        return typeText[type] || type;
      },
    },
    {
      title: t('tasks.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: any, record: Task) => (
        <Space size="middle">
          {record.status === 'pending' && (
            <Button
              type="link"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStartTask(record.id)}
            >
              {t('tasks.start')}
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
            {t('common.edit')}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTask(record.id)}
          >
            {t('common.delete')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <Title level={2}>{t('menu.taskManagement')}</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingTask(null);
            setIsModalVisible(true);
          }}
        >
          {t('tasks.newTask')}
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
              `${t('pagination.range', { start: range[0], end: range[1], total })}`,
          }}
        />
      </Card>

      {/* 创建/编辑任务模态框 */}
      <Modal
        title={editingTask ? t('tasks.editTask') : t('tasks.newTask')}
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
            type: 'content_generation',
          }}
        >
          <Form.Item
            name="title"
            label={t('tasks.taskName')}
            rules={[{ required: true, message: t('validation.taskNameRequired') }]}
          >
            <Input placeholder={t('placeholder.taskName')} />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('tasks.taskDescription')}
          >
            <Input.TextArea 
              placeholder={t('placeholder.taskDescription')}
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="type"
            label={t('tasks.taskType')}
            rules={[{ required: true, message: t('validation.taskTypeRequired') }]}
          >
            <Select placeholder={t('placeholder.taskType')}>
              <Option value="content_generation">{t('tasks.typeContentGeneration')}</Option>
              <Option value="content_publish">{t('tasks.typeContentPublish')}</Option>
              <Option value="batch">{t('tasks.typeBatch')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="publishTime"
            label={t('tasks.publishTime')}
          >
            <DatePicker
              showTime
              placeholder={t('placeholder.publishTime')}
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
                {editingTask ? t('common.update') : t('common.create')}
              </Button>
              <Button 
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                }}
              >
                {t('common.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Tasks;