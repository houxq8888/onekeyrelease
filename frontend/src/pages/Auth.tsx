import React, { useState } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  message, 
  Typography, 
  Space,
  Divider,
  Alert 
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  LoginOutlined,
  UserAddOutlined 
} from '@ant-design/icons';
import { useMutation } from 'react-query';
import { apiClient } from '@utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';

const { Title, Text } = Typography;

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login } = useAuthStore();

  // 登录请求
  const loginMutation = useMutation<any, any, any>(apiClient.auth.login, {
    onSuccess: (data) => {
      message.success('登录成功');
      // 更新认证状态
      login(data.data?.token || data.token, data.data?.user || data.user);
      localStorage.setItem('auth_token', data.data?.token || data.token);
      localStorage.setItem('user', JSON.stringify(data.data?.user || data.user));
      // 跳转到仪表板
      navigate('/dashboard');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '登录失败');
    },
  });

  // 注册请求
  const registerMutation = useMutation<any, any, any>(apiClient.auth.register, {
    onSuccess: () => {
      message.success('注册成功，请登录');
      setIsLogin(true);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '注册失败');
    },
  });

  const handleSubmit = (values: any) => {
    if (isLogin) {
      loginMutation.mutate(values);
    } else {
      registerMutation.mutate(values);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md shadow-lg">
        <div className="text-center mb-6">
          <Title level={2} className="mb-2">
            {isLogin ? '欢迎回来' : '创建账号'}
          </Title>
          <Text type="secondary">
            {isLogin ? '登录您的账号开始使用' : '注册新账号开始使用'}
          </Text>
        </div>

        <Alert
          message="演示版本"
          description="当前为演示版本，您可以使用任意用户名和密码登录"
          type="info"
          showIcon
          className="mb-4"
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="请输入用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="请输入密码"
            />
          </Form.Item>

          {!isLogin && (
            <Form.Item
              name="confirmPassword"
              label="确认密码"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="请再次输入密码"
              />
            </Form.Item>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              icon={isLogin ? <LoginOutlined /> : <UserAddOutlined />}
              loading={isLogin ? loginMutation.isLoading : registerMutation.isLoading}
            >
              {isLogin ? '登录' : '注册'}
            </Button>
          </Form.Item>
        </Form>

        <Divider>
          <Text type="secondary">或</Text>
        </Divider>

        <div className="text-center">
          <Space>
            <Text type="secondary">
              {isLogin ? '没有账号？' : '已有账号？'}
            </Text>
            <Button 
              type="link" 
              onClick={() => {
                setIsLogin(!isLogin);
                form.resetFields();
              }}
              className="p-0"
            >
              {isLogin ? '立即注册' : '立即登录'}
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Auth;