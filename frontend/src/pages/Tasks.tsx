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
import type { Dayjs } from 'dayjs';
import { apiClient } from '../utils/api';
import type { Task } from '../types';

const { Title } = Typography;
const { Option } = Select;

interface TaskFormValues {
  title: string;
  description?: string;
  type: 'content_generation' | 'publish' | 'both';
  publishTime?: Dayjs;
}

const Tasks: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm<TaskFormValues>();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { message } = App.useApp();

  // 获取任务列表
  const { data: tasks = [], isLoading } = useQuery<Task[]>('tasks', async () => {
    const response = await apiClient.tasks.list();
    return Array.isArray(response.data) ? response.data : [];
  });

  // 创建任务
  const createMutation = useMutation(
    (data: any) => apiClient.tasks.create(data),
    {
      onSuccess: () => {
        message.success(t('tasks.createSuccess'));
        setIsModalVisible(false);
        form.resetFields();
        queryClient.invalidateQueries('tasks');
      },
      onError: (error: any) => {
        console.error('创建任务失败:', error);
        const errorMsg = error?.response?.data?.error || error?.message || t('tasks.createError');
        message.error(errorMsg);
      },
    }
  );

  // 更新任务
  const updateMutation = useMutation(
    ({ id, data }: { id: string; data: any }) => apiClient.tasks.update(id, data),
    {
      onSuccess: () => {
        message.success(t('tasks.updateSuccess'));
        setIsModalVisible(false);
        setEditingTask(null);
        form.resetFields();
        queryClient.invalidateQueries('tasks');
      },
      onError: (error: any) => {
        console.error('更新任务失败:', error);
        const errorMsg = error?.response?.data?.error || error?.message || t('tasks.updateError');
        message.error(errorMsg);
      },
    }
  );

  // 启动任务
  const startMutation = useMutation(
    (id: string) => apiClient.tasks.start(id),
    {
      onSuccess: () => {
        message.success(t('tasks.startSuccess'));
        queryClient.invalidateQueries('tasks');
      },
      onError: (error: any) => {
        console.error('启动任务失败:', error);
        const errorMsg = error?.response?.data?.error || error?.message || t('tasks.startError');
        message.error(errorMsg);
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
        console.error('删除任务失败:', error);
        const errorMsg = error?.response?.data?.error || error?.message || t('tasks.deleteError');
        message.error(errorMsg);
      },
    }
  );

  const handleSubmit = (values: TaskFormValues) => {
    // 映射前端类型到后端类型
    const typeMapping: Record<string, string> = {
      'content_generation': 'content_generation',
      'publish': 'content_publish',
      'both': 'batch',
    };

    // 转换 publishTime 为 ISO 字符串
    const submitData: any = {
      title: values.title,
      description: values.description || '',
      type: typeMapping[values.type] || 'content_generation',
    };

    if (values.publishTime) {
      submitData.publishTime = values.publishTime.toISOString();
    }

    if (editingTask) {
      updateMutation.mutate({ id: editingTask.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const handleStartTask = (id: string) => {
    startMutation.mutate(id);
  };

  const handleDeleteTask = (id: string) => {
    Modal.confirm({
      title: t('common.confirm'),
      content: t('tasks.confirmDelete'),
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleEditTask = (record: Task) => {
    setEditingTask(record);
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      type: record.type,
    });
    setIsModalVisible(true);
  };

  const handleCreateNew = () => {
    setEditingTask(null);
    form.resetFields();
    setIsModalVisible(true);
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
        const typeText = {
          content_generation: t('tasks.typeContent'),
          publish: t('tasks.typePublish'),
          both: t('tasks.typeBoth'),
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
              loading={startMutation.isLoading}
            >
              {t('tasks.start')}
            </Button>
          )}
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditTask(record)}
          >
            {t('common.edit')}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTask(record.id)}
            loading={deleteMutation.isLoading}
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
          onClick={handleCreateNew}
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
              `${range[0]}-${range[1]} / ${total}`,
          }}
        />
      </Card>

      {/* 创建/编辑任务模态框 */}
      <Modal
        title={editingTask ? t('tasks.editTask') : t('tasks.createTask')}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setEditingTask(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            type: 'both',
          }}
        >
          <Form.Item
            name="title"
            label={t('tasks.taskName')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Input placeholder={t('tasks.placeholderTaskName')} />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('tasks.description')}
          >
            <Input.TextArea 
              placeholder={t('tasks.placeholderDescription')}
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="type"
            label={t('tasks.type')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Select placeholder={t('tasks.selectType')}>
              <Option value="content_generation">{t('tasks.typeContent')}</Option>
              <Option value="publish">{t('tasks.typePublish')}</Option>
              <Option value="both">{t('tasks.typeBoth')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="publishTime"
            label={t('tasks.publishTime')}
          >
            <DatePicker
              showTime
              placeholder={t('tasks.selectPublishTime')}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={createMutation.isLoading || updateMutation.isLoading}
              >
                {editingTask ? t('common.update') : t('common.create')}
              </Button>
              <Button 
                onClick={() => {
                  setIsModalVisible(false);
                  setEditingTask(null);
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
