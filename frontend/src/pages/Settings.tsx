import React from 'react';
import { Card, Form, Input, Button, Switch, Select, Divider, Typography, App } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { useForm } from 'antd/es/form/Form';
import { useAppStore } from '../store/appStore';

const { Title } = Typography;
const { Option } = Select;

interface SettingsForm {
  theme: 'light' | 'dark';
  language: 'zh-CN' | 'zh-TW' | 'en-US';
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
  const [form] = useForm<SettingsForm>();
  const [loading, setLoading] = React.useState(false);
  const { theme: currentTheme, language: currentLanguage, setTheme, setLanguage } = useAppStore();
  const { message } = App.useApp();

  const t = (cn: string, tw: string, en: string) => {
    if (currentLanguage === 'en-US') return en;
    if (currentLanguage === 'zh-TW') return tw;
    return cn;
  };

  // 模拟加载设置数据
  React.useEffect(() => {
    const mockSettings: SettingsForm = {
      theme: currentTheme,
      language: currentLanguage,
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
  }, [form]);

  const handleSave = async (values: SettingsForm) => {
    setLoading(true);
    try {
      console.log('保存设置:', values);
      
      setTheme(values.theme);
      setLanguage(values.language);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      message.success(t('设置保存成功', '設定已儲存', 'Settings saved'));
    } catch (error) {
      message.error(t('保存设置失败', '儲存設定失敗', 'Failed to save settings'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    message.info(t('设置已重置', '設定已重設', 'Settings reset'));
  };

  return (
    <div className="p-6">
      <Title level={2}>{t('系统设置', '系統設定', 'System Settings')}</Title>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        className="max-w-4xl"
      >
        {/* 界面设置 */}
        <Card title={t('界面设置', '介面設定', 'Interface Settings')} className="mb-6">
          <Form.Item label={t('主题', '佈景主題', 'Theme')} name="theme">
            <Select
              onChange={(value: 'light' | 'dark') => {
                setTheme(value);
                message.success(value === 'dark' 
                  ? t('已切换到深色模式', '已啟用深色模式', 'Dark mode enabled')
                  : t('已切换到浅色模式', '已啟用淺色模式', 'Light mode enabled'));
              }}
            >
              <Option value="light">{t('浅色', '淺色', 'Light')}</Option>
              <Option value="dark">{t('深色', '深色', 'Dark')}</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label={t('语言', '語言', 'Language')} name="language">
            <Select
              onChange={(value: 'zh-CN' | 'zh-TW' | 'en-US') => {
                setLanguage(value);
                message.success(value === 'en-US' ? 'Language changed to English' : value === 'zh-TW' ? '語言已切換為繁體中文' : '语言已切换为简体中文');
              }}
            >
              <Option value="zh-CN">简体中文</Option>
              <Option value="zh-TW">繁體中文</Option>
              <Option value="en-US">English</Option>
            </Select>
          </Form.Item>
        </Card>

        {/* 通知设置 */}
        <Card title={t('通知设置', '通知設定', 'Notification Settings')} className="mb-6">
          <Form.Item label={t('邮件通知', '郵件通知', 'Email Notifications')} name={['notifications', 'email']} valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item label={t('推送通知', '推播通知', 'Push Notifications')} name={['notifications', 'push']} valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item label={t('任务完成通知', '任務完成通知', 'Task Completion Notifications')} name={['notifications', 'taskComplete']} valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item label={t('任务错误通知', '任務錯誤通知', 'Task Error Notifications')} name={['notifications', 'taskError']} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Card>

        {/* API配置 */}
        <Card title={t('API配置', 'API設定', 'API Configuration')} className="mb-6">
          <Form.Item 
            label={t('OpenAI API密钥', 'OpenAI API金鑰', 'OpenAI API Key')} 
            name={['apiConfig', 'openaiApiKey']}
            help={t('用于内容生成的AI服务', '用於內容生成的AI服務', 'AI service for content generation')}
          >
            <Input.Password placeholder={t('请输入OpenAI API密钥', '請輸入OpenAI API金鑰', 'Enter OpenAI API Key')} />
          </Form.Item>
          
          <Form.Item 
            label="Stable Diffusion URL" 
            name={['apiConfig', 'stableDiffusionUrl']}
            help={t('用于图片生成的AI服务地址', '用於圖片生成的AI服務位址', 'AI service address for image generation')}
          >
            <Input placeholder="http://localhost:7860" />
          </Form.Item>
          
          <Form.Item 
            label={t('API超时时间(毫秒)', 'API逾時時間(毫秒)', 'API Timeout (ms)')} 
            name={['apiConfig', 'timeout']}
          >
            <Input type="number" min={1000} max={60000} />
          </Form.Item>
        </Card>

        {/* 任务设置 */}
        <Card title={t('任务设置', '任務設定', 'Task Settings')} className="mb-6">
          <Form.Item label={t('自动重试', '自動重試', 'Auto Retry')} name={['taskSettings', 'autoRetry']} valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item 
            label={t('最大重试次数', '最大重試次數', 'Max Retries')} 
            dependencies={[['taskSettings', 'autoRetry']]}
          >
            {({ getFieldValue }) => (
              <Form.Item name={['taskSettings', 'maxRetries']} noStyle>
                <Input 
                  type="number" 
                  min={1} 
                  max={10} 
                  disabled={!getFieldValue(['taskSettings', 'autoRetry'])}
                />
              </Form.Item>
            )}
          </Form.Item>
          
          <Form.Item 
            label={t('任务超时时间(毫秒)', '任務逾時時間(毫秒)', 'Task Timeout (ms)')} 
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
            {t('保存设置', '儲存設定', 'Save Settings')}
          </Button>
          
          <Button 
            icon={<ReloadOutlined />}
            onClick={handleReset}
            size="large"
          >
            {t('重置', '重設', 'Reset')}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default Settings;