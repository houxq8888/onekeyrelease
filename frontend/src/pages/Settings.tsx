import React from 'react';
import { Card, Form, Input, Button, Switch, Select, Divider, Typography, message } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { useForm } from 'antd/es/form/Form';
import { useAppStore } from '../store/appStore';
import { t } from '../locales';
import type { Language } from '../locales';
import type { ThemeMode } from '../theme';

const { Title } = Typography;
const { Option } = Select;

interface SettingsForm {
  theme: ThemeMode;
  language: Language;
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
  const { theme, language, setTheme, setLanguage } = useAppStore();

  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = localStorage.getItem('user-settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          form.setFieldsValue({
            theme: theme,
            language: language,
            ...parsed,
          });
        } else {
          form.setFieldsValue({
            theme: theme,
            language: language,
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
          });
        }
      } catch (error) {
        message.error(t('settings.settingsLoadFailed', language));
      }
    };

    loadSettings();
  }, [form, theme, language]);

  const handleSave = async (values: SettingsForm) => {
    setLoading(true);
    try {
      setTheme(values.theme);
      setLanguage(values.language);
      
      localStorage.setItem('user-settings', JSON.stringify({
        notifications: values.notifications,
        apiConfig: values.apiConfig,
        taskSettings: values.taskSettings,
      }));
      
      await new Promise(resolve => setTimeout(resolve, 500));
      message.success(t('settings.settingsSaved', language));
    } catch (error) {
      message.error(t('settings.settingsSaveFailed', language));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setTheme('light');
    setLanguage('zh-CN');
    localStorage.removeItem('user-settings');
    message.info(t('settings.settingsReset', language));
  };

  const handleThemeChange = (value: ThemeMode) => {
    setTheme(value);
  };

  const handleLanguageChange = (value: Language) => {
    setLanguage(value);
  };

  return (
    <div className="p-6">
      <Title level={2} style={{ color: theme === 'dark' ? '#f1f5f9' : '#1e293b' }}>
        {t('settings.title', language)}
      </Title>
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        className="max-w-4xl"
      >
        <Card 
          title={t('settings.interfaceSettings', language)} 
          className="mb-6"
          style={{ 
            backgroundColor: theme === 'dark' ? '#1f1f1f' : '#ffffff',
            borderColor: theme === 'dark' ? '#303030' : '#e8e8e8',
          }}
          headStyle={{ 
            color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
            borderBottomColor: theme === 'dark' ? '#303030' : '#e8e8e8',
          }}
        >
          <Form.Item label={t('settings.theme', language)} name="theme">
            <Select onChange={handleThemeChange}>
              <Option value="light">{t('settings.themeLight', language)}</Option>
              <Option value="dark">{t('settings.themeDark', language)}</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label={t('settings.language', language)} name="language">
            <Select onChange={handleLanguageChange}>
              <Option value="zh-CN">{t('settings.languageZhCN', language)}</Option>
              <Option value="zh-TW">{t('settings.languageZhTW', language)}</Option>
              <Option value="en-US">{t('settings.languageEnUS', language)}</Option>
            </Select>
          </Form.Item>
        </Card>

        <Card 
          title={t('settings.notificationSettings', language)} 
          className="mb-6"
          style={{ 
            backgroundColor: theme === 'dark' ? '#1f1f1f' : '#ffffff',
            borderColor: theme === 'dark' ? '#303030' : '#e8e8e8',
          }}
          headStyle={{ 
            color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
            borderBottomColor: theme === 'dark' ? '#303030' : '#e8e8e8',
          }}
        >
          <Form.Item label={t('settings.emailNotification', language)} name={['notifications', 'email']} valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item label={t('settings.pushNotification', language)} name={['notifications', 'push']} valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item label={t('settings.taskCompleteNotification', language)} name={['notifications', 'taskComplete']} valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item label={t('settings.taskErrorNotification', language)} name={['notifications', 'taskError']} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Card>

        <Card 
          title={t('settings.apiConfig', language)} 
          className="mb-6"
          style={{ 
            backgroundColor: theme === 'dark' ? '#1f1f1f' : '#ffffff',
            borderColor: theme === 'dark' ? '#303030' : '#e8e8e8',
          }}
          headStyle={{ 
            color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
            borderBottomColor: theme === 'dark' ? '#303030' : '#e8e8e8',
          }}
        >
          <Form.Item 
            label={t('settings.openaiApiKey', language)} 
            name={['apiConfig', 'openaiApiKey']}
            help={t('settings.openaiApiKeyHelp', language)}
          >
            <Input.Password placeholder={t('settings.openaiApiKey', language)} />
          </Form.Item>
          
          <Form.Item 
            label={t('settings.stableDiffusionUrl', language)} 
            name={['apiConfig', 'stableDiffusionUrl']}
            help={t('settings.stableDiffusionUrlHelp', language)}
          >
            <Input placeholder="http://localhost:7860" />
          </Form.Item>
          
          <Form.Item 
            label={t('settings.apiTimeout', language)} 
            name={['apiConfig', 'timeout']}
          >
            <Input type="number" min={1000} max={60000} />
          </Form.Item>
        </Card>

        <Card 
          title={t('settings.taskSettings', language)} 
          className="mb-6"
          style={{ 
            backgroundColor: theme === 'dark' ? '#1f1f1f' : '#ffffff',
            borderColor: theme === 'dark' ? '#303030' : '#e8e8e8',
          }}
          headStyle={{ 
            color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
            borderBottomColor: theme === 'dark' ? '#303030' : '#e8e8e8',
          }}
        >
          <Form.Item label={t('settings.autoRetry', language)} name={['taskSettings', 'autoRetry']} valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item 
            label={t('settings.maxRetries', language)} 
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
            label={t('settings.taskTimeout', language)} 
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
            {t('settings.saveSettings', language)}
          </Button>
          
          <Button 
            icon={<ReloadOutlined />}
            onClick={handleReset}
            size="large"
          >
            {t('common.reset', language)}
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default Settings;
