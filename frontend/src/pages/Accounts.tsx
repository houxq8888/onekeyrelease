import React, { useState } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  App,
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
import { useTranslation } from 'react-i18next';
import { apiClient } from '../utils/api';
import type { Account } from '../types';

const { Title } = Typography;

const Accounts: React.FC = () => {
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const { message } = App.useApp();

  // 获取账号列表
  const { data: accounts = [], isLoading } = useQuery<Account[]>('accounts', async () => {
    const response = await apiClient.accounts.list();
    return Array.isArray(response.data) ? response.data : [];
  });

  // 创建账号
  const createMutation = useMutation(apiClient.accounts.create, {
    onSuccess: () => {
      message.success(t('accounts.addSuccess'));
      setIsModalVisible(false);
      form.resetFields();
      queryClient.invalidateQueries('accounts');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || t('accounts.addFailed'));
    },
  });

  // 测试账号
  const testMutation = useMutation(
    (id: string) => apiClient.accounts.test(id),
    {
      onSuccess: () => {
        message.success(t('accounts.testSuccess'));
        queryClient.invalidateQueries('accounts');
      },
      onError: (error: any) => {
        message.error(error.response?.data?.error || t('accounts.testFailed'));
      },
    }
  );

  // 删除账号
  const deleteMutation = useMutation(
    (id: string) => apiClient.accounts.delete(id),
    {
      onSuccess: () => {
        message.success(t('accounts.deleteSuccess'));
        queryClient.invalidateQueries('accounts');
      },
      onError: (error: any) => {
        message.error(error.response?.data?.error || t('accounts.deleteFailed'));
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
      title: t('accounts.platform'),
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => (
        <Tag color="red">{platform === 'xiaohongshu' ? t('accounts.xiaohongshu') : platform}</Tag>
      ),
    },
    {
      title: t('accounts.username'),
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: t('accounts.nickname'),
      dataIndex: 'nickname',
      key: 'nickname',
    },
    {
      title: t('accounts.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig = {
          active: { 
            color: 'success', 
            text: t('accounts.statusActive'), 
            icon: <CheckCircleOutlined /> 
          },
          inactive: { 
            color: 'default', 
            text: t('accounts.statusInactive'), 
            icon: <ExclamationCircleOutlined /> 
          },
          error: { 
            color: 'error', 
            text: t('accounts.statusError'), 
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
      title: t('accounts.lastLogin'),
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (date: string) => date ? new Date(date).toLocaleString() : t('accounts.neverLogin'),
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
      render: (_: any, record: Account) => (
        <Space size="middle">
          <Button
            type="link"
            size="small"
            onClick={() => handleTestAccount(record.id)}
            loading={testMutation.isLoading}
          >
            {t('accounts.test')}
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
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('common.confirmDelete')}
            description={t('accounts.confirmDeleteContent')}
            onConfirm={() => handleDeleteAccount(record.id)}
            okText={t('common.ok')}
            cancelText={t('common.cancel')}
          >
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
            >
              {t('common.delete')}
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
        <Title level={2}>{t('menu.accounts')}</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingAccount(null);
            setIsModalVisible(true);
          }}
        >
          {t('accounts.addAccount')}
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
              `${t('pagination.range', { start: range[0], end: range[1], total })}`,
          }}
        />
      </Card>

      {/* 添加/编辑账号模态框 */}
      <Modal
        title={editingAccount ? t('accounts.editAccount') : t('accounts.addXiaohongshu')}
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
            label={t('accounts.platform')}
          >
            <Input disabled value={t('accounts.xiaohongshu')} />
          </Form.Item>

          <Form.Item
            name="username"
            label={t('accounts.username')}
            rules={[{ required: true, message: t('validation.usernameRequired') }]}
          >
            <Input placeholder={t('placeholder.xhsUsername')} />
          </Form.Item>

          <Form.Item
            name="password"
            label={t('accounts.password')}
            rules={[{ required: true, message: t('validation.passwordRequired') }]}
          >
            <Input.Password placeholder={t('placeholder.xhsPassword')} />
          </Form.Item>

          <Form.Item
            name="nickname"
            label={t('accounts.nickname')}
            rules={[{ required: true, message: t('validation.nicknameRequired') }]}
          >
            <Input placeholder={t('placeholder.accountNickname')} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={createMutation.isLoading}
              >
                {editingAccount ? t('common.update') : t('common.add')}
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

export default Accounts;