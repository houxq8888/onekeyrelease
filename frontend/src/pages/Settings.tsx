import React from 'react';
import { Card, Form, Input, Button, Switch, Select, Divider, Typography, message } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { useForm } from 'antd/es/form/Form';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { theme, language, setTheme, setLanguage } = useAppStore();

  // 加载设置数据
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        // 从 localStorage 加载设置或从 store 获取
        const savedSettings = localStorage.getItem('user-settings');
        let settings: SettingsForm;
        
        if (savedSettings) {
          settings = JSON.parse(savedSettings);
        } else {
          settings = {
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
        }
        
        form.setFieldsValue(settings);
      } catch (error) {
        message.error(t('settings.loadError'));
      }
    };

    loadSettings();
  }, [form, t, theme, language]);

  const handleSave = async (values: SettingsForm) => {
    console.log('Settings handleSave:', values);
    setLoading(true);
    try {
      // 保存到 localStorage
      localStorage.setItem('user-settings', JSON.stringify(values));
      
      // 更新全局状态
      console.log('调用 setTheme:', values.theme);
      console.log('调用 setLanguage:', values.language);
      setTheme(values.theme);
      setLanguage(values.language);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      message.success(t('settings.saveSuccess'));
    } catch (error) {
      message.error(t('settings.saveError'));
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
              <Option value="light">{t('settings.themeLight')}</Option>
              <Option value="dark">{t('settings.themeDark')}</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label={t('settings.language')} name="language">
            <Select>
              <Option value="zh-CN">{t('settings.languageZhCN')}</Option>
              <Option value="zh-TW">{t('settings.languageZhTW')}</Option>
              <Option value="en-US">{t('settings.languageEnUS')}</Option>
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
            <Input.Password placeholder={t('settings.openaiApiKey')} />
          </Form.Item>
          
          <Form.Item 
            label={t('settings.sdUrl')} 
            name={['apiConfig', 'stableDiffusionUrl']}
            help={t('settings.sdUrlHelp')}
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
            {t('common.save')}
          </Button>
          
          <Button 
            icon={<ReloadOutlined />}
            onClick={handleReset}
            size="large"
          >
            {t('common.reset')}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default Settings;
