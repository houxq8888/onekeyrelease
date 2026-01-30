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
  Card,
  Typography,
  App
} from 'antd';
import { 
  PlusOutlined, 
  PlayCircleOutlined, 
  EditOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiClient } from '../utils/api';
import { useTranslation } from '../hooks/useTranslation';
import type { Task } from '../types';

const { Title } = Typography;
const { Option } = Select;

const Tasks: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { message } = App.useApp();

  // 获取任务列表
  const { data: tasks = [], isLoading } = useQuery<Task[]>('tasks', async () => {
    const response = await apiClient.tasks.list();
    return Array.isArray(response.data.data) ? response.data.data : [];
  });

  // 创建任务
  const createMutation = useMutation(apiClient.tasks.create, {
    onSuccess: () => {
      message.success(t('tasks.createSuccess'));
      setIsModalVisible(false);
      form.resetFields();
      setEditingTask(null);
      queryClient.invalidateQueries('tasks');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || t('tasks.createFailed'));
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
        message.error(error.response?.data?.message || t('tasks.startFailed'));
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
        message.error(error.response?.data?.message || t('tasks.deleteFailed'));
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
      title: t('common.confirm'),
      content: t('tasks.deleteConfirm'),
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const columns = [
    {
      title: t('tasks.name'),
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
          pending: { color: 'default', text: t('tasks.status.pending') },
          running: { color: 'processing', text: t('tasks.status.running') },
          completed: { color: 'success', text: t('tasks.status.completed') },
          failed: { color: 'error', text: t('tasks.status.failed') },
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
        const typeText = {
          content_generation: t('tasks.type.content_generation'),
          publish: t('tasks.type.publish'),
          both: t('tasks.type.both'),
        };
        return typeText[type as keyof typeof typeText] || type;
      },
    },
    {
      title: t('tasks.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: t('common.actions'),
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
        <Title level={2}>{t('tasks.title')}</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingTask(null);
            setIsModalVisible(true);
          }}
        >
          {t('tasks.create')}
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
              t('tasks.pagination', { start: range[0], end: range[1], total }),
          }}
        />
      </Card>

      {/* 创建/编辑任务模态框 */}
      <Modal
        title={editingTask ? t('tasks.edit') : t('tasks.create')}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
          setEditingTask(null);
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
            label={t('tasks.name')}
            rules={[{ required: true, message: t('tasks.nameRequired') }]}
          >
            <Input placeholder={t('tasks.namePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('tasks.description')}
          >
            <Input.TextArea 
              placeholder={t('tasks.descriptionPlaceholder')}
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="type"
            label={t('tasks.type')}
            rules={[{ required: true, message: t('tasks.typeRequired') }]}
          >
            <Select placeholder={t('tasks.typePlaceholder')}>
              <Option value="content_generation">{t('tasks.type.content_generation')}</Option>
              <Option value="publish">{t('tasks.type.publish')}</Option>
              <Option value="both">{t('tasks.type.both')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="publishTime"
            label={t('tasks.publishTime')}
          >
            <DatePicker
              showTime
              placeholder={t('tasks.publishTimePlaceholder')}
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
                  setEditingTask(null);
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