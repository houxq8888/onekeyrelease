import React from 'react';
import { Card, Form, Input, Button, Switch, Select, Divider, Typography, message } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { useForm } from 'antd/es/form/Form';
import { useAppStore } from '../store/appStore';

const { Title } = Typography;
const { Option } = Select;

interface SettingsForm {
  theme: 'light' | 'dark';
  language: 'zh-CN' | 'en-US' | 'zh-TW';
  notifications: {
    email: boolean;
    push: boolean;
    taskComplete: boolean;
    taskError: boolean;
  };
  apiConfig: {
    openaiApiKey: string;
    stableDiffusionUrl: string;
    timeout: number;
  };
  taskSettings: {
    autoRetry: boolean;
    maxRetries: number;
    timeout: number;
  };
}

const Settings: React.FC = () => {
  const { setTheme, setLanguage, theme, language } = useAppStore();
  const [form] = useForm<SettingsForm>();
  const [loading, setLoading] = React.useState(false);

  // 模拟加载设置数据
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        // 这里应该从API获取设置
        const mockSettings: SettingsForm = {
          theme: theme || 'light',
          language: language || 'zh-CN',
          notifications: {
            email: true,
            push: false,
            taskComplete: true,
            taskError: true,
          },
          apiConfig: {
            openaiApiKey: '',
            stableDiffusionUrl: 'http://localhost:7860',
            timeout: 30000,
          },
          taskSettings: {
            autoRetry: true,
            maxRetries: 3,
            timeout: 300000,
          },
        };
        form.setFieldsValue(mockSettings);
      } catch (error) {
        message.error('加载设置失败');
      }
    };

    loadSettings();
  }, [form]);

  const handleSave = async (values: SettingsForm) => {
    setLoading(true);
    try {
      // 这里应该调用API保存设置
      console.log('Settings组件 - 保存设置:', values);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
      
      // 更新主题和语言
      console.log('Settings组件 - 更新主题:', values.theme);
      setTheme(values.theme);
      console.log('Settings组件 - 更新语言:', values.language);
      setLanguage(values.language);
      
      message.success('设置保存成功');
    } catch (error) {
      console.error('Settings组件 - 保存设置失败:', error);
      message.error('保存设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    message.info('设置已重置');
  };

  return (
    <div className="p-6">
      <Title level={2}>系统设置</Title>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        className="max-w-4xl"
      >
        {/* 界面设置 */}
        <Card title="界面设置" className="mb-6">
          <Form.Item label="主题" name="theme">
            <Select>
              <Option value="light">浅色</Option>
              <Option value="dark">深色</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label="语言" name="language">
            <Select>
              <Option value="zh-CN">简体中文</Option>
              <Option value="zh-TW">繁體中文</Option>
              <Option value="en-US">English</Option>
            </Select>
          </Form.Item>
        </Card>

        {/* 通知设置 */}
        <Card title="通知设置" className="mb-6">
          <Form.Item label="邮件通知" name={['notifications', 'email']} valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item label="推送通知" name={['notifications', 'push']} valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item label="任务完成通知" name={['notifications', 'taskComplete']} valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item label="任务错误通知" name={['notifications', 'taskError']} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Card>

        {/* API配置 */}
        <Card title="API配置" className="mb-6">
          <Form.Item 
            label="OpenAI API密钥" 
            name={['apiConfig', 'openaiApiKey']}
            help="用于内容生成的AI服务"
          >
            <Input.Password placeholder="请输入OpenAI API密钥" />
          </Form.Item>
          
          <Form.Item 
            label="Stable Diffusion URL" 
            name={['apiConfig', 'stableDiffusionUrl']}
            help="用于图片生成的AI服务地址"
          >
            <Input placeholder="http://localhost:7860" />
          </Form.Item>
          
          <Form.Item 
            label="API超时时间(毫秒)" 
            name={['apiConfig', 'timeout']}
          >
            <Input type="number" min={1000} max={60000} />
          </Form.Item>
        </Card>

        {/* 任务设置 */}
        <Card title="任务设置" className="mb-6">
          <Form.Item label="自动重试" name={['taskSettings', 'autoRetry']} valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item 
            label="最大重试次数" 
            name={['taskSettings', 'maxRetries']}
            dependencies={[['taskSettings', 'autoRetry']]}
          >
            {({ getFieldValue }) => (
              <Input 
                type="number" 
                min={1} 
                max={10} 
                disabled={!getFieldValue(['taskSettings', 'autoRetry'])}
              />
            )}
          </Form.Item>
          
          <Form.Item 
            label="任务超时时间(毫秒)" 
            name={['taskSettings', 'timeout']}
          >
            <Input type="number" min={30000} max={1800000} />
          </Form.Item>
        </Card>

        <Divider />
        
        <div className="flex gap-4">
          <Button 
            type="primary" 
            htmlType="submit" 
            icon={<SaveOutlined />}
            loading={loading}
            size="large"
          >
            保存设置
          </Button>
          
          <Button 
            icon={<ReloadOutlined />}
            onClick={handleReset}
            size="large"
          >
            重置
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default Settings;