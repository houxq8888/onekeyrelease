import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Space,
  Divider,
  Alert,
  App 
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  LoginOutlined,
  UserAddOutlined 
} from '@ant-design/icons';
import { useMutation } from 'react-query';
import { apiClient } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

const Auth: React.FC = () => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { message } = App.useApp();

  // 登录请求
  const loginMutation = useMutation<any, any, any>(apiClient.auth.login, {
    onSuccess: (data) => {
      console.log('Login request success:', data);
      message.success(t('auth.loginSuccess'));
      // 更新认证状态 - 注意后端返回的是 _id，前端期望的是 id
      const userData = {
        id: data.user?._id || data.user?.id,
        username: data.user?.username,
        email: data.user?.email,
        role: data.user?.role
      };
      console.log('处理后的用户数据:', userData);
      login(data.token, userData);
      console.log('调用login后，准备导航到/');
      // 使用 setTimeout 确保状态更新后再导航
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || t('auth.loginFailed'));
    },
  });

  // Register request
  const registerMutation = useMutation(apiClient.auth.register, {
    onSuccess: () => {
      message.success(t('auth.registerSuccess'));
      setIsLogin(true);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || t('auth.registerFailed'));
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
            {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
          </Title>
          <Text type="secondary">
            {isLogin ? t('auth.loginToStart') : t('auth.registerToStart')}
          </Text>
        </div>

        <Alert
          message={t('auth.demoVersion')}
          description={t('auth.demoDescription')}
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
            label={t('auth.username')}
            rules={[{ required: true, message: t('auth.enterUsername') }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder={t('auth.enterUsername')}
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={t('auth.password')}
            rules={[{ required: true, message: t('auth.enterPassword') }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder={t('auth.enterPassword')}
            />
          </Form.Item>

          {!isLogin && (
            <Form.Item
              name="confirmPassword"
              label={t('auth.confirmPassword')}
              dependencies={['password']}
              rules={[
                { required: true, message: t('auth.enterConfirmPassword') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t('auth.passwordMismatch')));
                  },
                }),
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder={t('auth.enterConfirmPassword')}
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
              {isLogin ? t('auth.login') : t('auth.register')}
            </Button>
          </Form.Item>
        </Form>

        <Divider>
          <Text type="secondary">{t('auth.or')}</Text>
        </Divider>

        <div className="text-center">
          <Space>
            <Text type="secondary">
              {isLogin ? t('auth.noAccount') : t('auth.haveAccount')}
            </Text>
            <Button 
              type="link" 
              onClick={() => {
                setIsLogin(!isLogin);
                form.resetFields();
              }}
              className="p-0"
            >
              {isLogin ? t('auth.registerNow') : t('auth.loginNow')}
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Auth;