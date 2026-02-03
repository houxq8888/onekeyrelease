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
import { useTranslation } from 'react-i18next';
import { apiClient } from '../utils/api';
import type { Task } from '../types';

const { Title } = Typography;
const { Option } = Select;

// 任务类型映射 - 与后端模型匹配
const TASK_TYPES = {
  content_generation: 'content_generation',  // 内容生成
  content_publish: 'content_publish',        // 发布
  batch: 'batch',                            // 批量任务
} as const;

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
    // 处理后端返回的数据结构
    const responseData = response.data as any;
    if (responseData && Array.isArray(responseData.tasks)) {
      return responseData.tasks;
    }
    if (Array.isArray(responseData)) {
      return responseData;
    }
    return [];
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
      message.error(error.response?.data?.error || t('tasks.createError'));
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
        message.error(error.response?.data?.error || t('tasks.startError'));
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
        message.error(error.response?.data?.error || t('tasks.deleteError'));
      },
    }
  );

  const handleCreateTask = (values: any) => {
    // 转换日期格式
    const taskData = {
      ...values,
      publishTime: values.publishTime ? values.publishTime.toISOString() : undefined,
    };
    createMutation.mutate(taskData);
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
      title: t('tasks.taskName'),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: t('tasks.taskDescription'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: t('tasks.taskStatus'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig: Record<string, { color: string; text: string }> = {
          pending: { color: 'default', text: t('tasks.statusPending') },
          running: { color: 'processing', text: t('tasks.statusRunning') },
          completed: { color: 'success', text: t('tasks.statusCompleted') },
          failed: { color: 'error', text: t('tasks.statusFailed') },
          cancelled: { color: 'warning', text: t('tasks.statusCancelled') },
        };
        const config = statusConfig[status] || statusConfig.pending;
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: t('tasks.taskType'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeText: Record<string, string> = {
          content_generation: t('tasks.typeContentGeneration'),
          content_publish: t('tasks.typePublish'),
          batch: t('tasks.typeBoth'),
        };
        return typeText[type] || type;
      },
    },
    {
      title: t('tasks.taskCreatedAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: t('tasks.taskActions'),
      key: 'action',
      render: (_: any, record: Task) => (
        <Space size="middle">
          {record.status === 'pending' && (
            <Button
              type="link"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStartTask(record.id)}
            >
              {t('tasks.startTask')}
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
        title={editingTask ? t('common.edit') : t('tasks.newTask')}
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
            type: TASK_TYPES.content_generation,
          }}
        >
          <Form.Item
            name="title"
            label={t('tasks.taskName')}
            rules={[{ required: true, message: t('tasks.taskName') }]}
          >
            <Input placeholder={t('tasks.taskName')} />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('tasks.taskDescription')}
          >
            <Input.TextArea
              placeholder={t('tasks.taskDescription')}
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="type"
            label={t('tasks.taskType')}
            rules={[{ required: true, message: t('tasks.taskType') }]}
          >
            <Select placeholder={t('tasks.taskType')}>
              <Option value={TASK_TYPES.content_generation}>{t('tasks.typeContentGeneration')}</Option>
              <Option value={TASK_TYPES.content_publish}>{t('tasks.typePublish')}</Option>
              <Option value={TASK_TYPES.batch}>{t('tasks.typeBoth')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="publishTime"
            label={t('tasks.publishTime')}
          >
            <DatePicker
              showTime
              placeholder={t('tasks.publishTime')}
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
