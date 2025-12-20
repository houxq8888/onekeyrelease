import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  message,
  Card,
  Typography,
  Popconfirm 
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  CheckCircleOutlined,
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiClient } from '@utils/api';
import type { Account } from '@types';

const { Title } = Typography;

const Accounts: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // 获取账号列表
  const { data: accounts, isLoading } = useQuery('accounts', async () => {
    const response = await apiClient.accounts.list();
    return response.data || [];
  });

  // 创建账号
  const createMutation = useMutation(apiClient.accounts.create, {
    onSuccess: () => {
      message.success('账号添加成功');
      setIsModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries('accounts');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '添加账号失败');
    },
  });

  // 测试账号
  const testMutation = useMutation(
    (id: string) => apiClient.accounts.test(id),
    {
      onSuccess: () => {
        message.success('账号测试成功');
        queryClient.invalidateQueries('accounts');
      },
      onError: (error: any) => {
        message.error(error.response?.data?.error || '账号测试失败');
      },
    }
  );

  // 删除账号
  const deleteMutation = useMutation(
    (id: string) => apiClient.accounts.delete(id),
    {
      onSuccess: () => {
        message.success('账号删除成功');
        queryClient.invalidateQueries('accounts');
      },
      onError: (error: any) => {
        message.error(error.response?.data?.error || '删除账号失败');
      },
    }
  );

  const handleCreateAccount = (values: any) => {
    createMutation.mutate(values);
  };

  const handleTestAccount = (id: string) => {
    testMutation.mutate(id);
  };

  const handleDeleteAccount = (id: string) => {
    deleteMutation.mutate(id);
  };

  const columns = [
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => (
        <Tag color="red">{platform === 'xiaohongshu' ? '小红书' : platform}</Tag>
      ),
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          active: { 
            color: 'success', 
            text: '正常', 
            icon: <CheckCircleOutlined /> 
          },
          inactive: { 
            color: 'default', 
            text: '未激活', 
            icon: <ExclamationCircleOutlined /> 
          },
          error: { 
            color: 'error', 
            text: '异常', 
            icon: <ExclamationCircleOutlined /> 
          },
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: '最后登录',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (date: string) => date ? new Date(date).toLocaleString() : '从未登录',
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
      render: (_, record: Account) => (
        <Space size="middle">
          <Button
            type="link"
            size="small"
            onClick={() => handleTestAccount(record.id)}
            loading={testMutation.isLoading}
          >
            测试
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingAccount(record);
              setIsModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个账号吗？"
            onConfirm={() => handleDeleteAccount(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <Title level={2}>账号管理</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingAccount(null);
            setIsModalVisible(true);
          }}
        >
          添加账号
        </Button>
      </div>

      {/* 账号列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={accounts}
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

      {/* 添加/编辑账号模态框 */}
      <Modal
        title={editingAccount ? '编辑账号' : '添加小红书账号'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateAccount}
          initialValues={editingAccount || {
            platform: 'xiaohongshu',
          }}
        >
          <Form.Item
            name="platform"
            label="平台"
          >
            <Input disabled value="小红书" />
          </Form.Item>

          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入小红书用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入小红书密码" />
          </Form.Item>

          <Form.Item
            name="nickname"
            label="昵称"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="请输入账号昵称（用于识别）" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={createMutation.isLoading}
              >
                {editingAccount ? '更新' : '添加'}
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

export default Accounts;