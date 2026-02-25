import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Form, 
  Input, 
  Select, 
  Switch, 
  App, 
  Typography, 
  Space,
  Row,
  Col,
  Divider, 
  Image,
  Tabs 
} from 'antd';
import { 
  RocketOutlined, 
  DownloadOutlined,
  UploadOutlined,
  SendOutlined,
  EditOutlined 
} from '@ant-design/icons';
import { useMutation } from 'react-query';
import { apiClient } from '../utils/api';
import type { GenerationConfig } from '../types';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;
const { Option } = Select;

const ContentGenerator: React.FC = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [manualForm] = Form.useForm();
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [currentContentId, setCurrentContentId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const { message } = App.useApp();

  // 内容生成Mutation
  const generateMutation = useMutation((data: any) => apiClient.content.generate(data), {
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: (response: any) => {
      setGeneratedContent(response.data);
      // 保存内容ID，用于后续图片保存
      if (response.data._id) {
        setCurrentContentId(response.data._id);
      }
      message.success(t('contentGenerator.generateSuccess'));
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || t('contentGenerator.generateFailed'));
    },
    onSettled: () => {
      setIsGenerating(false);
    },
  });

  // 图片生成Mutation
  const generateImagesMutation = useMutation((data: any) => apiClient.content.generateImages(data), {
    onMutate: () => {
      setIsGeneratingImages(true);
    },
    onSuccess: async (response) => {
      const images = Array.isArray(response.data) ? response.data : [];
      setGeneratedImages(images);
      
      // 如果存在内容ID，将图片保存到内容记录中
      if (currentContentId && images.length > 0) {
        try {
          await apiClient.content.saveImages(currentContentId, { images });
          message.success(t('contentGenerator.imagesSavedSuccess'));
        } catch (error: any) {
          console.error('保存图片失败:', error);
          message.success(t('contentGenerator.imagesSuccess'));
        }
      } else {
        message.success(t('contentGenerator.imagesSuccess'));
      }
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || t('contentGenerator.imagesFailed'));
    },
    onSettled: () => {
      setIsGeneratingImages(false);
    },
  });

  // 发布内容Mutation
  const publishMutation = useMutation((data: any) => apiClient.content.publish(data), {
    onMutate: () => {
      setIsPublishing(true);
    },
    onSuccess: () => {
      message.success(t('contentGenerator.publishSuccess'));
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || t('contentGenerator.publishFailed'));
    },
    onSettled: () => {
      setIsPublishing(false);
    },
  });

  // 手动录入内容Mutation
  const manualMutation = useMutation((data: any) => apiClient.content.manual(data), {
    onMutate: () => {
      setIsManualSubmitting(true);
    },
    onSuccess: (response: any) => {
      setGeneratedContent(response.data);
      // 保存内容ID，用于后续图片保存
      if (response.data._id) {
        setCurrentContentId(response.data._id);
      }
      message.success(t('contentGenerator.manualSuccess'));
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || t('contentGenerator.manualFailed'));
    },
    onSettled: () => {
      setIsManualSubmitting(false);
    },
  });

  const handleGenerate = (values: any) => {
    generateMutation.mutate(values);
  };

  const handleSaveAsTask = () => {
    if (!generatedContent) return;
    
    // 创建任务
    apiClient.tasks.create({
      title: `发布: ${generatedContent.title}`,
      description: generatedContent.description,
      type: 'publish',
      content: generatedContent,
    }).then(() => {
      message.success(t('contentGenerator.taskCreated'));
    }).catch(() => {
      message.error(t('contentGenerator.taskFailed'));
    });
  };

  const handleGenerateImages = () => {
    const topic = form.getFieldValue('topic');
    if (!topic) {
      message.error(t('contentGenerator.topicFirst'));
      return;
    }
    generateImagesMutation.mutate({ theme: topic, count: 3 });
  };

  const handlePublish = () => {
    if (!generatedContent || generatedImages.length === 0) {
      message.error(t('contentGenerator.contentAndImagesFirst'));
      return;
    }
    publishMutation.mutate({
      content: generatedContent,
      images: generatedImages,
      platform: 'xiaohongshu',
    });
  };

  const handleManualSubmit = (values: any) => {
    manualMutation.mutate(values);
  };

  const defaultConfig: GenerationConfig = {
    style: 'casual',
    tone: 'friendly',
    length: 'medium',
    keywords: [],
    targetAudience: '年轻女性',
    includeHashtags: true,
    includeEmojis: true,
  };

  const tabItems = [
    {
      key: 'ai',
      label: (
        <span>
          <RocketOutlined />
          {t('contentGenerator.aiGenerate')}
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          {/* 配置表单 */}
          <Col xs={24} lg={12}>
            <Card title={t('contentGenerator.generateConfig')}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleGenerate}
                initialValues={defaultConfig}
              >
                <Form.Item
                  name="topic"
                  label="主题"
                  rules={[{ required: true, message: t('contentGenerator.topicRequired') }]}
                >
                  <Input placeholder={t('contentGenerator.topicPlaceholder')} />
                </Form.Item>

                <Form.Item
                  name="keywords"
                  label={t('tasks.keywords')}
                >
                  <Select
                    mode="tags"
                    placeholder={t('contentGenerator.keywordsPlaceholder')}
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item
                  name="targetAudience"
                  label={t('contentGenerator.targetAudience')}
                >
                  <Select placeholder={t('contentGenerator.audiencePlaceholder')}>
                    <Option value="年轻女性">{t('contentGenerator.youngWomen')}</Option>
                    <Option value="职场人士">{t('contentGenerator.officeWorkers')}</Option>
                    <Option value="学生群体">{t('contentGenerator.students')}</Option>
                    <Option value="家庭主妇">{t('contentGenerator.housewives')}</Option>
                    <Option value="其他">{t('contentGenerator.other')}</Option>
                  </Select>
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="style"
                      label={t('contentGenerator.contentStyle')}
                    >
                      <Select>
                        <Option value="casual">{t('contentGenerator.casual')}</Option>
                        <Option value="professional">{t('contentGenerator.professional')}</Option>
                        <Option value="creative">{t('contentGenerator.creative')}</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="tone"
                      label={t('contentGenerator.tone')}
                    >
                      <Select>
                        <Option value="friendly">{t('contentGenerator.friendly')}</Option>
                        <Option value="formal">{t('contentGenerator.formal')}</Option>
                        <Option value="humorous">{t('contentGenerator.humorous')}</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="length"
                  label={t('contentGenerator.contentLength')}
                >
                  <Select>
                    <Option value="short">{t('contentGenerator.short')}</Option>
                    <Option value="medium">{t('contentGenerator.medium')}</Option>
                    <Option value="long">{t('contentGenerator.long')}</Option>
                  </Select>
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="includeHashtags"
                      label={t('contentGenerator.includeHashtags')}
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="includeEmojis"
                      label={t('contentGenerator.includeEmojis')}
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<RocketOutlined />}
                    loading={isGenerating}
                    size="large"
                    block
                  >
                    {t('contentGenerator.generateContent')}
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* 生成结果 */}
          <Col xs={24} lg={12}>
            <Card 
              title={t('contentGenerator.generateResult')} 
              extra={
                generatedContent && (
                  <Space>
                    <Button 
                      icon={<UploadOutlined />}
                      loading={isGeneratingImages}
                      onClick={handleGenerateImages}
                    >
                      {t('contentGenerator.generateImages')}
                    </Button>
                    <Button 
                      icon={<DownloadOutlined />}
                      onClick={handleSaveAsTask}
                    >
                      {t('contentGenerator.createPublishTask')}
                    </Button>
                    <Button 
                      type="primary"
                      icon={<SendOutlined />}
                      loading={isPublishing}
                      disabled={generatedImages.length === 0}
                      onClick={handlePublish}
                    >
                      {t('contentGenerator.oneClickPublish')}
                    </Button>
                  </Space>
                )
              }
            >
              {generatedContent ? (
                <div className="space-y-4">
                  <div>
                    <Text strong>{t('contentGenerator.titleResult')}</Text>
                    <Text>{generatedContent.title}</Text>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <Text strong>{t('contentGenerator.contentResult')}</Text>
                    <div 
                      className="mt-2 p-3 bg-gray-50 rounded"
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {generatedContent.content || generatedContent.text}
                    </div>
                  </div>

                  {generatedContent.hashtags && generatedContent.hashtags.length > 0 && (
                    <div>
                      <Text strong>{t('contentGenerator.hashtags')}</Text>
                      <div className="mt-2">
                        {generatedContent.hashtags.map((tag: string, index: number) => (
                          <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-2">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 生成的图片 */}
                  {generatedImages.length > 0 && (
                    <div>
                      <Divider />
                      <Text strong>{t('contentGenerator.resultImages')}</Text>
                      <Row gutter={[8, 8]} className="mt-2">
                        {generatedImages.map((image, index) => (
                          <Col span={8} key={index}>
                            <Image 
                              src={image} 
                              alt={`${t('contentGenerator.generateImageAlt')}${index + 1}`}
                              style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8 }}
                            />
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <RocketOutlined className="text-4xl text-gray-300 mb-4" />
                  <Text type="secondary">
                    {t('contentGenerator.emptyAiHint')}
                  </Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'manual',
      label: (
        <span>
          <EditOutlined />
          {t('contentGenerator.manualInput')}
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          {/* 手动录入表单 */}
          <Col xs={24} lg={12}>
            <Card title={t('contentGenerator.inputTitle')}>
              <Form
                form={manualForm}
                layout="vertical"
                onFinish={handleManualSubmit}
              >
                <Form.Item
                  name="title"
                  label={t('contentGenerator.titleLabel')}
                  rules={[{ required: true, message: t('contentGenerator.titleRequired') }]}
                >
                  <Input placeholder={t('contentGenerator.titlePlaceholder')} />
                </Form.Item>

                <Form.Item
                  name="content"
                  label={t('contentGenerator.contentLabel')}
                  rules={[{ required: true, message: t('contentGenerator.contentRequired') }]}
                >
                  <Input.TextArea 
                    placeholder={t('contentGenerator.contentPlaceholder')} 
                    rows={8}
                    showCount
                    maxLength={2000}
                  />
                </Form.Item>

                <Form.Item
                  name="keywords"
                  label="关键词"
                >
                  <Select
                    mode="tags"
                    placeholder={t('contentGenerator.keywordsPlaceholder')}
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item
                  name="theme"
                  label="主题"
                  rules={[{ required: true, message: t('contentGenerator.topicRequired') }]}
                >
                  <Input placeholder={t('contentGenerator.topicPlaceholder')} />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="targetAudience"
                      label="目标受众"
                    >
                      <Select placeholder={t('contentGenerator.audiencePlaceholder')}>
                        <Option value="年轻女性">{t('contentGenerator.youngWomen')}</Option>
                        <Option value="职场人士">{t('contentGenerator.officeWorkers')}</Option>
                        <Option value="学生群体">{t('contentGenerator.students')}</Option>
                        <Option value="家庭主妇">{t('contentGenerator.housewives')}</Option>
                        <Option value="general">{t('contentGenerator.general')}</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="style"
                      label={t('contentGenerator.contentStyle')}
                    >
                      <Select>
                        <Option value="casual">{t('contentGenerator.casual')}</Option>
                        <Option value="professional">{t('contentGenerator.professional')}</Option>
                        <Option value="creative">{t('contentGenerator.creative')}</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="summary"
                  label={t('contentGenerator.summary')}
                >
                  <Input.TextArea 
                    placeholder={t('contentGenerator.summaryPlaceholder')} 
                    rows={3}
                    showCount
                    maxLength={200}
                  />
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<EditOutlined />}
                    loading={isManualSubmitting}
                    size="large"
                    block
                  >
                    {t('contentGenerator.saveContent')}
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* 录入结果 */}
          <Col xs={24} lg={12}>
            <Card 
              title={t('contentGenerator.inputResult')} 
              extra={
                generatedContent && (
                  <Space>
                    <Button 
                      icon={<UploadOutlined />}
                      loading={isGeneratingImages}
                      onClick={handleGenerateImages}
                    >
                      {t('contentGenerator.generateImages')}
                    </Button>
                    <Button 
                      icon={<DownloadOutlined />}
                      onClick={handleSaveAsTask}
                    >
                      {t('contentGenerator.createPublishTask')}
                    </Button>
                    <Button 
                      type="primary"
                      icon={<SendOutlined />}
                      loading={isPublishing}
                      disabled={generatedImages.length === 0}
                      onClick={handlePublish}
                    >
                      {t('contentGenerator.oneClickPublish')}
                    </Button>
                  </Space>
                )
              }
            >
              {generatedContent ? (
                <div className="space-y-4">
                  <div>
                    <Text strong>{t('contentGenerator.titleResult')}</Text>
                    <Text>{generatedContent.title}</Text>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <Text strong>{t('contentGenerator.contentResult')}</Text>
                    <div 
                      className="mt-2 p-3 bg-gray-50 rounded"
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {generatedContent.content || generatedContent.text}
                    </div>
                  </div>

                  {generatedContent.keywords && generatedContent.keywords.length > 0 && (
                    <div>
                      <Text strong>{t('contentGenerator.keywordResult')}</Text>
                      <div className="mt-2">
                        {generatedContent.keywords.map((keyword: string, index: number) => (
                          <span key={index} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-2 mb-2">
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 生成的图片 */}
                  {generatedImages.length > 0 && (
                    <div>
                      <Divider />
                      <Text strong>{t('contentGenerator.resultImages')}</Text>
                      <Row gutter={[8, 8]} className="mt-2">
                        {generatedImages.map((image, index) => (
                          <Col span={8} key={index}>
                            <Image 
                              src={image} 
                              alt={`${t('contentGenerator.generateImageAlt')}${index + 1}`}
                              style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 8 }}
                            />
                          </Col>
                        ))}
                      </Row>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <EditOutlined className="text-4xl text-gray-300 mb-4" />
                  <Text type="secondary">
                    {t('contentGenerator.emptyManualHint')}
                  </Text>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Title level={2}>{t('contentGenerator.title')}</Title>
      
      <Tabs 
        defaultActiveKey="ai" 
        items={tabItems}
        size="large"
      />
    </div>
  );
};

export default ContentGenerator;