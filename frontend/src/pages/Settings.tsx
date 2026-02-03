import React from 'react';
import { Card, Form, Input, Button, Switch, Select, Divider, Typography, App } from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { useForm } from 'antd/es/form/Form';
import { useTranslation } from 'react-i18next';
import { useAppStore, Theme, Language } from '../store/appStore';

const { Title } = Typography;
const { Option } = Select;

interface SettingsForm {
  theme: Theme;
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
  const { t, i18n } = useTranslation();
  const { theme, language, setTheme, setLanguage } = useAppStore();
  const { message } = App.useApp();

  // 加载设置数据
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        // 从 localStorage 加载其他设置
        const savedSettings = localStorage.getItem('user-settings');
        let otherSettings: Partial<SettingsForm> = {};

        if (savedSettings) {
          otherSettings = JSON.parse(savedSettings);
        }

        // 使用 store 中的主题和语言设置
        const settings: SettingsForm = {
          theme: theme || 'light',
          language: language || 'zh-CN',
          notifications: {
            email: true,
            push: false,
            taskComplete: true,
            taskError: true,
            ...otherSettings.notifications,
          },
          apiConfig: {
            openaiApiKey: '',
            stableDiffusionUrl: 'http://localhost:7860',
            timeout: 30000,
            ...otherSettings.apiConfig,
          },
          taskSettings: {
            autoRetry: true,
            maxRetries: 3,
            timeout: 300000,
            ...otherSettings.taskSettings,
          },
        };

        form.setFieldsValue(settings);
      } catch (error) {
        message.error(t('settings.loadError'));
      }
    };

    loadSettings();
  }, [form, theme, language, t]);

  const handleSave = async (values: SettingsForm) => {
    setLoading(true);
    try {
      // 保存其他设置到 localStorage
      localStorage.setItem('user-settings', JSON.stringify(values));

      // 应用主题设置
      setTheme(values.theme);

      // 应用语言设置 - 直接调用 i18n.changeLanguage 确保立即生效
      await i18n.changeLanguage(values.language);
      setLanguage(values.language);

      // 模拟API调用
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
