import React from 'react';
import { Card, Form, Input, Button, Switch, Select, Divider, Typography, message } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { useForm } from 'antd/es/form/Form';
import { useAppStore } from '../store/appStore';
import { useLocaleStore } from '../store/localeStore';

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
  const { theme, setTheme, language, setLanguage } = useAppStore();
  const { t } = useLocaleStore();

  // 模拟加载设置数据
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        // 这里应该从API获取设置
        const mockSettings: SettingsForm = {
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
        };
        form.setFieldsValue(mockSettings);
      } catch (error) {
        message.error('加载设置失败');
      }
    };

    loadSettings();
  }, [form, theme, language]);

  const handleSave = async (values: SettingsForm) => {
    setLoading(true);
    try {
      // 更新主题和语言
      if (values.theme !== theme) {
        setTheme(values.theme);
      }
      if (values.language !== language) {
        setLanguage(values.language);
      }
      
      // 这里应该调用API保存其他设置
      console.log('保存设置:', values);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟API调用
      message.success('设置保存成功');
    } catch (error) {
      message.error('保存设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    message.info('设置已重置');
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  const handleLanguageChange = (newLanguage: 'zh-CN' | 'zh-TW' | 'en-US') => {
    setLanguage(newLanguage);
    message.success('语言切换成功');
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
            <Select onChange={handleThemeChange}>
              <Option value="light">{t('settings.theme.light')}</Option>
              <Option value="dark">{t('settings.theme.dark')}</Option>
            </Select>
          </Form.Item>
          
          <Form.Item label={t('settings.language')} name="language">
            <Select onChange={handleLanguageChange}>
              <Option value="zh-CN">{t('settings.language.zh-CN')}</Option>
              <Option value="zh-TW">{t('settings.language.zh-TW')}</Option>
              <Option value="en-US">{t('settings.language.en-US')}</Option>
            </Select>
          </Form.Item>
        </Card>

        {/* 通知设置 */}
        <Card title={t('settings.notifications')} className="mb-6">
          <Form.Item label={t('settings.notifications.email')} name={['notifications', 'email']} valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item label={t('settings.notifications.push')} name={['notifications', 'push']} valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item label={t('settings.notifications.taskComplete')} name={['notifications', 'taskComplete']} valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item label={t('settings.notifications.taskError')} name={['notifications', 'taskError']} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Card>

        {/* API配置 */}
        <Card title={t('settings.api')} className="mb-6">
          <Form.Item 
            label={t('settings.api.openaiKey')} 
            name={['apiConfig', 'openaiApiKey']}
            help={t('settings.api.openaiKey.help')}
          >
            <Input.Password placeholder={t('settings.api.openaiKey')} />
          </Form.Item>
          
          <Form.Item 
            label={t('settings.api.stableDiffusionUrl')} 
            name={['apiConfig', 'stableDiffusionUrl']}
            help={t('settings.api.stableDiffusionUrl.help')}
          >
            <Input placeholder="http://localhost:7860" />
          </Form.Item>
          
          <Form.Item 
            label={t('settings.api.timeout')} 
            name={['apiConfig', 'timeout']}
          >
            <Input type="number" min={1000} max={60000} />
          </Form.Item>
        </Card>

        {/* 任务设置 */}
        <Card title={t('settings.tasks')} className="mb-6">
          <Form.Item label={t('settings.tasks.autoRetry')} name={['taskSettings', 'autoRetry']} valuePropName="checked">
            <Switch />
          </Form.Item>
          
          <Form.Item 
            label={t('settings.tasks.maxRetries')} 
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
            label={t('settings.tasks.timeout')} 
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