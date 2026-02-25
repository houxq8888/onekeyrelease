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
import { useAppStore } from '../store/appStore';
import { t } from '../locales';
import type { Task } from '../types';

const { Title } = Typography;
const { Option } = Select;

const Tasks: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { language, theme } = useAppStore();

  const { data: tasks = [], isLoading } = useQuery<Task[]>('tasks', async () => {
    try {
      const response = await apiClient.tasks.list();
      const data = response as any;
      if (data?.data?.tasks && Array.isArray(data.data.tasks)) {
        return data.data.tasks;
      }
      if (data?.data && Array.isArray(data.data)) {
        return data.data;
      }
      if (Array.isArray(data)) {
        return data;
      }
      if (data?.tasks && Array.isArray(data.tasks)) {
        return data.tasks;
      }
      return [];
    } catch (error) {
      console.error('获取任务列表失败:', error);
      return [];
    }
  });

  const createMutation = useMutation(
    async (values: any) => {
      const taskData = {
        title: values.title,
        description: values.description || '',
        type: values.type === 'publish' ? 'content_publish' : 
              values.type === 'both' ? 'batch' : 'content_generation',
        config: {
          contentConfig: {
            theme: '',
            keywords: [],
            targetAudience: '',
            style: 'casual' as const,
            wordCount: 500,
          },
          publishConfig: values.publishTime ? {
            platform: 'xiaohongshu' as const,
            scheduleTime: values.publishTime.toDate ? values.publishTime.toDate() : new Date(values.publishTime),
            autoPublish: false,
          } : undefined,
        },
      };
      return apiClient.tasks.create(taskData);
    },
    {
      onSuccess: () => {
        message.success(t('tasks.taskCreated', language));
        setIsModalVisible(false);
        form.resetFields();
        queryClient.invalidateQueries('tasks');
      },
      onError: (error: any) => {
        console.error('创建任务错误:', error);
        const errorMsg = error?.response?.data?.error || 
                        error?.response?.data?.message || 
                        error?.message ||
                        t('tasks.taskCreateFailed', language);
        message.error(errorMsg);
      },
    }
  );

  const startMutation = useMutation(
    (id: string) => apiClient.tasks.start(id),
    {
      onSuccess: () => {
        message.success(t('tasks.taskStarted', language));
        queryClient.invalidateQueries('tasks');
      },
      onError: (error: any) => {
        console.error('启动任务错误:', error);
        message.error(error?.response?.data?.error || t('tasks.taskStartFailed', language));
      },
    }
  );

  const deleteMutation = useMutation(
    (id: string) => apiClient.tasks.delete(id),
    {
      onSuccess: () => {
        message.success(t('tasks.taskDeleted', language));
        queryClient.invalidateQueries('tasks');
      },
      onError: (error: any) => {
        console.error('删除任务错误:', error);
        message.error(error?.response?.data?.error || t('tasks.taskDeleteFailed', language));
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
      title: t('tasks.confirmDelete', language),
      content: t('tasks.confirmDeleteMessage', language),
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; text: string }> = {
      pending: { color: 'default', text: t('tasks.statusPending', language) },
      running: { color: 'processing', text: t('tasks.statusRunning', language) },
      completed: { color: 'success', text: t('tasks.statusCompleted', language) },
      failed: { color: 'error', text: t('tasks.statusFailed', language) },
      cancelled: { color: 'warning', text: '已取消' },
    };
    return configs[status] || configs.pending;
  };

  const getTypeText = (type: string) => {
    const types: Record<string, string> = {
      content_generation: t('tasks.taskTypeContentGeneration', language),
      content_publish: t('tasks.taskTypePublish', language),
      batch: t('tasks.taskTypeBoth', language),
    };
    return types[type] || type;
  };

  const columns = [
    {
      title: t('tasks.taskName', language),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: t('tasks.taskDescription', language),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('tasks.status', language),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = getStatusConfig(status);
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: t('tasks.taskType', language),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => getTypeText(type),
    },
    {
      title: t('tasks.createdAt', language),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => date ? new Date(date).toLocaleString() : '-',
    },
    {
      title: t('tasks.actions', language),
      key: 'action',
      render: (_: any, record: Task) => (
        <Space size="middle">
          {record.status === 'pending' && (
            <Button
              type="link"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStartTask(record.id)}
            >
              {t('tasks.start', language)}
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
            {t('common.edit', language)}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTask(record.id)}
          >
            {t('tasks.delete', language)}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Title level={2} style={{ color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }}>
          {t('tasks.title', language)}
        </Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingTask(null);
            setIsModalVisible(true);
          }}
        >
          {t('tasks.createTask', language)}
        </Button>
      </div>

      <Card 
        style={{ 
          backgroundColor: theme === 'dark' ? '#1f1f1f' : '#ffffff',
          borderColor: theme === 'dark' ? '#303030' : '#e8e8e8',
        }}
      >
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              t('tasks.pagination', language)
                .replace('{start}', String(range[0]))
                .replace('{end}', String(range[1]))
                .replace('{total}', String(total)),
          }}
        />
      </Card>

      <Modal
        title={editingTask ? t('tasks.editTask', language) : t('tasks.createTask', language)}
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
            label={t('tasks.taskName', language)}
            rules={[{ required: true, message: t('tasks.taskNameRequired', language) }]}
          >
            <Input placeholder={t('tasks.taskNamePlaceholder', language)} />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('tasks.taskDescription', language)}
          >
            <Input.TextArea 
              placeholder={t('tasks.taskDescriptionPlaceholder', language)}
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="type"
            label={t('tasks.taskType', language)}
            rules={[{ required: true, message: t('tasks.taskTypeRequired', language) }]}
          >
            <Select placeholder={t('tasks.taskTypePlaceholder', language)}>
              <Option value="content_generation">{t('tasks.taskTypeContentGeneration', language)}</Option>
              <Option value="publish">{t('tasks.taskTypePublish', language)}</Option>
              <Option value="both">{t('tasks.taskTypeBoth', language)}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="publishTime"
            label={t('tasks.publishTime', language)}
          >
            <DatePicker
              showTime
              placeholder={t('tasks.publishTimePlaceholder', language)}
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
                {editingTask ? t('common.save', language) : t('common.create', language)}
              </Button>
              <Button 
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                }}
              >
                {t('common.cancel', language)}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Tasks;
