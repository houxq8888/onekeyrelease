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
  Checkbox,
  message,
  Card,
  Typography 
} from 'antd';
import dayjs from 'dayjs';
import { 
  PlusOutlined, 
  PlayCircleOutlined, 
  EditOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiClient } from '../utils/api';
import type { Task } from '../types';
// import { useLocaleStore } from '../store/localeStore';

const { Title } = Typography;
const { Option } = Select;

const Tasks: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  // const { t } = useLocaleStore();

  // 获取任务列表
  const { data: tasks = [], isLoading } = useQuery<Task[]>('tasks', async () => {
    const response = await apiClient.tasks.list();
    // 后端返回的数据格式是 { success: true, data: { tasks: [...], total: number, page: number, pageSize: number } }
    if (response.data && response.data.tasks) {
      return Array.isArray(response.data.tasks) ? response.data.tasks : [];
    }
    return [];
  });

  // 创建任务
  const createMutation = useMutation(apiClient.tasks.create, {
    onSuccess: () => {
      message.success('任务创建成功');
      setIsModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries('tasks');
      queryClient.invalidateQueries('dashboard-stats');
      queryClient.invalidateQueries('recent-tasks');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '创建任务失败');
    },
  });

  // 更新任务
  const updateMutation = useMutation(
    (data: { id: string; taskData: any }) => apiClient.tasks.update(data.id, data.taskData),
    {
      onSuccess: () => {
        message.success('任务更新成功');
        setIsModalVisible(false);
        form.resetFields();
        setEditingTask(null);
        queryClient.invalidateQueries('tasks');
        queryClient.invalidateQueries('dashboard-stats');
        queryClient.invalidateQueries('recent-tasks');
      },
      onError: (error: any) => {
        message.error(error.response?.data?.error || '更新任务失败');
      },
    }
  );

  // 启动任务
  const startMutation = useMutation(
    (id: string) => apiClient.tasks.start(id),
    {
      onSuccess: () => {
        message.success('任务已启动');
        queryClient.invalidateQueries('tasks');
        queryClient.invalidateQueries('dashboard-stats');
        queryClient.invalidateQueries('recent-tasks');
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
        queryClient.invalidateQueries('dashboard-stats');
        queryClient.invalidateQueries('recent-tasks');
      },
      onError: (error: any) => {
        message.error(error.response?.data?.error || '删除任务失败');
      },
    }
  );

  const handleCreateTask = (values: any) => {
    // 检查发布时间是否合理
    if (values.publishTime && values.publishTime.toDate) {
      const selectedTime = values.publishTime.toDate();
      const now = new Date();
      const timeDiff = selectedTime.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      // 如果选择的是过去的时间
      if (hoursDiff < 0) {
        message.warning('发布时间不能早于当前时间');
        return;
      }

      // 如果启用了邮件提醒
      if (values.enableNotification) {
        // 检查是否填写了邮箱列表
        if (!values.emailList || values.emailList.length === 0) {
          message.warning('请输入至少一个通知邮箱');
          return;
        }

        // 计算提醒时间
        const remindTime = new Date(selectedTime.getTime() - (values.remindBeforeDays || 1) * 24 * 60 * 60 * 1000);
        const remindDate = remindTime.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

        // 显示邮件提醒确认对话框
        Modal.confirm({
          title: '邮件提醒确认',
          content: (
            <div>
              <p style={{ fontSize: '16px', marginBottom: '12px' }}>
                <strong>📧 邮件提醒设置</strong>
              </p>
              <p style={{ marginBottom: '8px' }}>
                任务将在 <strong>{selectedTime.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</strong> 发布
              </p>
              <p style={{ marginBottom: '8px' }}>
                系统将在 <strong style={{ color: '#1890ff' }}>{remindDate}</strong> 发送邮件提醒
              </p>
              <div style={{ 
                background: '#f0f9ff', 
                padding: '12px', 
                borderRadius: '6px',
                marginTop: '12px' 
              }}>
                <p style={{ margin: 0, fontSize: '14px' }}>
                  <strong>📬 通知邮箱列表：</strong>
                </p>
                <ul style={{ 
                  marginTop: '8px', 
                  marginBottom: 0, 
                  paddingLeft: '20px',
                  fontSize: '14px' 
                }}>
                  {values.emailList.map((email: string, index: number) => (
                    <li key={index} style={{ marginBottom: '4px' }}>
                      {email}
                    </li>
                  ))}
                </ul>
              </div>
              <p style={{ 
                marginTop: '12px', 
                fontSize: '13px', 
                color: '#666' 
              }}>
                💡 提示：确保邮箱地址正确，系统将在指定时间前发送提醒邮件
              </p>
            </div>
          ),
          onOk: () => {
            createTaskWithTime(values);
          },
          onCancel: () => {
            form.setFieldsValue({ enableNotification: false });
          },
          okText: '确认创建',
          cancelText: '取消',
          width: 520,
        });
        return;
      }
    }

    // 时间合理或未选择时间，直接创建/更新任务
    createTaskWithTime(values);
  };

  const createTaskWithTime = (values: any) => {
    const taskData = {
      title: values.title,
      description: values.description,
      type: values.type,
      config: {
        contentConfig: {
          theme: values.title,
          keywords: [],
          targetAudience: 'general',
          style: 'casual',
          wordCount: 500,
        },
        publishConfig: (values.publishTime && values.publishTime.toDate) ? {
          scheduleTime: values.publishTime.toDate(),
          autoPublish: true,
        } : undefined,
      },
      notificationConfig: values.enableNotification ? {
        enabled: true,
        emailList: values.emailList || [],
        remindBeforeDays: values.remindBeforeDays || 1,
      } : undefined,
    };

    // 根据是否有 editingTask 决定是创建还是更新
    if (editingTask) {
      updateMutation.mutate({
        id: editingTask._id || editingTask.id,
        taskData,
      });
    } else {
      createMutation.mutate(taskData);
    }
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

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalVisible(true);
    
    // 设置表单初始值
    form.setFieldsValue({
      title: task.title,
      description: task.description,
      type: task.type,
      publishTime: task.publishTime ? dayjs(task.publishTime) : null,
      enableNotification: task.notificationConfig?.enabled || false,
      emailList: task.notificationConfig?.emailList || [],
      remindBeforeDays: task.notificationConfig?.remindBeforeDays || 1,
    });
  };

  const columns = [
    {
      title: '任务ID',
      dataIndex: '_id',
      key: '_id',
      width: 120,
      render: (id: string) => {
        const shortId = id ? id.substring(id.length - 8) : '-';
        return <code style={{ 
          fontSize: '12px', 
          padding: '2px 6px', 
          background: '#f5f5f5', 
          borderRadius: '3px',
          color: '#666'
        }}>{shortId}</code>;
      },
    },
    {
      title: '任务名称',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: Task) => (
        <div>
          <div style={{ fontWeight: 500 }}>{title}</div>
          {record.description && (
            <div style={{ 
              fontSize: '12px', 
              color: '#999', 
              marginTop: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '200px'
            }}>
              {record.description}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '创建者',
      dataIndex: 'createdBy',
      key: 'createdBy',
      width: 120,
      render: (createdBy: any) => {
        if (!createdBy) return '-';
        return (
          <div style={{ 
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ 
              color: '#1890ff',
              fontWeight: 500
            }}>
              {createdBy.username || '-'}
            </span>
          </div>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
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
      width: 120,
      render: (type: string) => {
        const typeText = {
          content_generation: '内容生成',
          content_publish: '发布',
          batch: '生成并发布',
        };
        return typeText[type as keyof typeof typeText] || type;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => (
        <div style={{ fontSize: '12px' }}>
          {new Date(date).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Task) => (
        <Space size="middle">
          {record.status === 'pending' && (
            <Button
              type="link"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStartTask(record._id || record.id)}
              title={`启动任务: ${record.title}`}
            >
              启动
            </Button>
          )}
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEditTask(record)}
            title={`编辑任务: ${record.title}`}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTask(record._id || record.id)}
            title={`删除任务: ${record.title}`}
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
          rowKey={(record) => record._id || record.id}
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
        title={
          <div>
            {editingTask ? '编辑任务' : '新建任务'}
            {editingTask && (
              <span style={{ 
                fontSize: '12px', 
                color: '#999', 
                marginLeft: '12px',
                fontWeight: 'normal'
              }}>
                ID: {editingTask._id || editingTask.id}
              </span>
            )}
          </div>
        }
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
            type: 'batch',
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
              <Option value="content_publish">发布</Option>
              <Option value="batch">生成并发布</Option>
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

          <Form.Item
            name="enableNotification"
            label="启用邮件提醒"
            valuePropName="checked"
          >
            <Checkbox>在发布前发送邮件提醒</Checkbox>
          </Form.Item>

          <Form.Item
            name="emailList"
            label="通知邮箱列表"
            rules={[
              {
                validator: (_, value) => {
                  const enableNotification = form.getFieldValue('enableNotification');
                  if (enableNotification && (!value || value.length === 0)) {
                    return Promise.reject('请输入至少一个通知邮箱');
                  }
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Select
              mode="tags"
              placeholder="输入邮箱后按回车添加"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="remindBeforeDays"
            label="提前提醒天数"
            rules={[
              { required: true, message: '请选择提前提醒天数' },
              {
                type: 'number',
                min: 1,
                max: 30,
                message: '提醒天数必须在1-30天之间',
              },
            ]}
          >
            <Select placeholder="选择提前提醒天数">
              <Option value={1}>提前1天</Option>
              <Option value={2}>提前2天</Option>
              <Option value={3}>提前3天</Option>
              <Option value={7}>提前7天</Option>
              <Option value={15}>提前15天</Option>
              <Option value={30}>提前30天</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={createMutation.isLoading || updateMutation.isLoading}
              >
                {editingTask ? '更新' : '创建'}
              </Button>
              <Button 
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                  setEditingTask(null);
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