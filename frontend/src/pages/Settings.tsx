import React from 'react';
import { Card, Form, Input, Button, Switch, Select, Divider, Typography, App } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { useForm } from 'antd/es/form/Form';
import { useAppStore } from '../store/appStore';
import { useTranslation } from '../hooks/useTranslation';

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
  const { theme: currentTheme, setTheme, language: currentLanguage, setLanguage } = useAppStore();
  const { message } = App.useApp();
  const { t } = useTranslation();

  // 模拟加载设置数据
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        // 这里应该从API获取设置
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
      } catch (error) {
        message.error(t('settings.loadFailed'));
      }
    };

    loadSettings();
  }, [form, currentTheme, currentLanguage]);

  const handleSave = async (values: SettingsForm) => {
    setLoading(true);
    try {
      // 应用主题设置
      if (values.theme !== currentTheme) {
        setTheme(values.theme);
      }
      
      // 应用语言设置
      if (values.language !== currentLanguage) {
        setLanguage(values.language);
      }
      
      // 这里应该调用API保存设置
      console.log('保存设置:', values);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
      message.success(t('settings.saveSuccess'));
    } catch (error) {
      message.error(t('settings.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    message.info(t('settings.resetSuccess'));
  };

  return (
    <div className="p-6">
      <Title level={2}>{t('settings.title')}</Title>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        className="max-w-4xl"
      >
        {/* 界面设置 */}
        <Card title={t('settings.interface')} className="mb-6">
          <Form.Item label={t('settings.theme')} name="theme">
            <Select>
              <Option value="light">{t('settings.light')}</Option>
              <Option value="dark">{t('settings.dark')}</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label={t('settings.language')} name="language">
            <Select>
              <Option value="zh-CN">{t('settings.zhCN')}</Option>
              <Option value="zh-TW">{t('settings.zhTW')}</Option>
              <Option value="en-US">{t('settings.enUS')}</Option>
            </Select>
          </Form.Item>
        </Card>

        {/* 通知设置 */}
        <Card title={t('settings.notifications')} className="mb-6">
          <Form.Item label={t('settings.emailNotification')} name={['notifications', 'email']} valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item label={t('settings.pushNotification')} name={['notifications', 'push']} valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item label={t('settings.taskCompleteNotification')} name={['notifications', 'taskComplete']} valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item label={t('settings.taskErrorNotification')} name={['notifications', 'taskError']} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Card>

        {/* API配置 */}
        <Card title={t('settings.apiConfig')} className="mb-6">
          <Form.Item 
            label={t('settings.openaiApiKey')} 
            name={['apiConfig', 'openaiApiKey']}
            help={t('settings.openaiApiKeyHelp')}
          >
            <Input.Password placeholder={t('settings.openaiApiKeyPlaceholder')} />
          </Form.Item>
          
          <Form.Item 
            label={t('settings.stableDiffusionUrl')} 
            name={['apiConfig', 'stableDiffusionUrl']}
            help={t('settings.stableDiffusionUrlHelp')}
          >
            <Input placeholder="http://localhost:7860" />
          </Form.Item>
          
          <Form.Item 
            label={t('settings.apiTimeout')} 
            name={['apiConfig', 'timeout']}
          >
            <Input type="number" min={1000} max={60000} />
          </Form.Item>
        </Card>

        {/* 任务设置 */}
        <Card title={t('settings.taskSettings')} className="mb-6">
          <Form.Item label={t('settings.autoRetry')} name={['taskSettings', 'autoRetry']} valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item 
            label={t('settings.maxRetries')} 
            dependencies={[['taskSettings', 'autoRetry']]}
          >
            {({ getFieldValue }) => (
              <Form.Item 
                name={['taskSettings', 'maxRetries']}
                noStyle
              >
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
            label={t('settings.taskTimeout')} 
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
            {t('settings.saveSettings')}
          </Button>
          
          <Button 
            icon={<ReloadOutlined />}
            onClick={handleReset}
            size="large"
          >
            {t('settings.reset')}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default Settings;