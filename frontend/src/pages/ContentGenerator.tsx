import React, { useState } from 'react';
import { 
  Card, 
  Button, 
  Form, 
  Input, 
  Select, 
  Switch, 
  message, 
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

const { Title, Text } = Typography;
const { Option } = Select;

const ContentGenerator: React.FC = () => {
  const [form] = Form.useForm();
  const [manualForm] = Form.useForm();
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [currentContentId, setCurrentContentId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);

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
      message.success('内容生成成功！');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '内容生成失败');
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
          message.success('图片生成并保存成功！');
        } catch (error: any) {
          console.error('保存图片失败:', error);
          message.success('图片生成成功！');
        }
      } else {
        message.success('图片生成成功！');
      }
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '图片生成失败');
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
      message.success('内容发布成功！');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '内容发布失败');
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
      message.success('内容录入成功！');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '内容录入失败');
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
      message.success('已创建发布任务');
    }).catch(() => {
      message.error('创建任务失败');
    });
  };

  const handleGenerateImages = () => {
    const topic = form.getFieldValue('topic');
    if (!topic) {
      message.error('请先输入主题');
      return;
    }
    generateImagesMutation.mutate({ theme: topic, count: 3 });
  };

  const handlePublish = () => {
    if (!generatedContent || generatedImages.length === 0) {
      message.error('请先生成内容和图片');
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
          AI生成内容
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          {/* 配置表单 */}
          <Col xs={24} lg={12}>
            <Card title="生成配置">
              <Form
                form={form}
                layout="vertical"
                onFinish={handleGenerate}
                initialValues={defaultConfig}
              >
                <Form.Item
                  name="topic"
                  label="主题"
                  rules={[{ required: true, message: '请输入主题' }]}
                >
                  <Input placeholder="例如：美妆护肤、旅行攻略、美食探店" />
                </Form.Item>

                <Form.Item
                  name="keywords"
                  label="关键词"
                >
                  <Select
                    mode="tags"
                    placeholder="输入关键词，按回车添加"
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item
                  name="targetAudience"
                  label="目标受众"
                >
                  <Select placeholder="选择目标受众">
                    <Option value="年轻女性">年轻女性</Option>
                    <Option value="职场人士">职场人士</Option>
                    <Option value="学生群体">学生群体</Option>
                    <Option value="家庭主妇">家庭主妇</Option>
                    <Option value="其他">其他</Option>
                  </Select>
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="style"
                      label="内容风格"
                    >
                      <Select>
                        <Option value="casual">日常休闲</Option>
                        <Option value="professional">专业正式</Option>
                        <Option value="creative">创意有趣</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="tone"
                      label="语气语调"
                    >
                      <Select>
                        <Option value="friendly">亲切友好</Option>
                        <Option value="formal">正式严谨</Option>
                        <Option value="humorous">幽默风趣</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="length"
                  label="内容长度"
                >
                  <Select>
                    <Option value="short">简短精炼</Option>
                    <Option value="medium">适中详细</Option>
                    <Option value="long">长篇大论</Option>
                  </Select>
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="includeHashtags"
                      label="包含话题标签"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="includeEmojis"
                      label="包含表情符号"
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
                    生成内容
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* 生成结果 */}
          <Col xs={24} lg={12}>
            <Card 
              title="生成结果" 
              extra={
                generatedContent && (
                  <Space>
                    <Button 
                      icon={<UploadOutlined />}
                      loading={isGeneratingImages}
                      onClick={handleGenerateImages}
                    >
                      生成图片
                    </Button>
                    <Button 
                      icon={<DownloadOutlined />}
                      onClick={handleSaveAsTask}
                    >
                      创建发布任务
                    </Button>
                    <Button 
                      type="primary"
                      icon={<SendOutlined />}
                      loading={isPublishing}
                      disabled={generatedImages.length === 0}
                      onClick={handlePublish}
                    >
                      一键发布
                    </Button>
                  </Space>
                )
              }
            >
              {generatedContent ? (
                <div className="space-y-4">
                  <div>
                    <Text strong>标题：</Text>
                    <Text>{generatedContent.title}</Text>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <Text strong>内容：</Text>
                    <div 
                      className="mt-2 p-3 bg-gray-50 rounded"
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {generatedContent.content || generatedContent.text}
                    </div>
                  </div>

                  {generatedContent.hashtags && generatedContent.hashtags.length > 0 && (
                    <div>
                      <Text strong>话题标签：</Text>
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
                      <Text strong>生成的图片：</Text>
                      <Row gutter={[8, 8]} className="mt-2">
                        {generatedImages.map((image, index) => (
                          <Col span={8} key={index}>
                            <Image 
                              src={image} 
                              alt={`生成图片 ${index + 1}`}
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
                    配置参数后点击生成内容，AI将为您创作小红书风格的优质内容
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
          手动录入内容
        </span>
      ),
      children: (
        <Row gutter={[24, 24]}>
          {/* 手动录入表单 */}
          <Col xs={24} lg={12}>
            <Card title="内容录入">
              <Form
                form={manualForm}
                layout="vertical"
                onFinish={handleManualSubmit}
              >
                <Form.Item
                  name="title"
                  label="标题"
                  rules={[{ required: true, message: '请输入标题' }]}
                >
                  <Input placeholder="请输入内容标题" />
                </Form.Item>

                <Form.Item
                  name="content"
                  label="正文"
                  rules={[{ required: true, message: '请输入正文内容' }]}
                >
                  <Input.TextArea 
                    placeholder="请输入正文内容" 
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
                    placeholder="输入关键词，按回车添加"
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item
                  name="theme"
                  label="主题"
                  rules={[{ required: true, message: '请输入主题' }]}
                >
                  <Input placeholder="例如：美妆护肤、旅行攻略、美食探店" />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="targetAudience"
                      label="目标受众"
                    >
                      <Select placeholder="选择目标受众">
                        <Option value="年轻女性">年轻女性</Option>
                        <Option value="职场人士">职场人士</Option>
                        <Option value="学生群体">学生群体</Option>
                        <Option value="家庭主妇">家庭主妇</Option>
                        <Option value="general">通用</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="style"
                      label="内容风格"
                    >
                      <Select>
                        <Option value="casual">日常休闲</Option>
                        <Option value="professional">专业正式</Option>
                        <Option value="creative">创意有趣</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="summary"
                  label="摘要"
                >
                  <Input.TextArea 
                    placeholder="请输入内容摘要（可选）" 
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
                    保存内容
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* 录入结果 */}
          <Col xs={24} lg={12}>
            <Card 
              title="录入结果" 
              extra={
                generatedContent && (
                  <Space>
                    <Button 
                      icon={<UploadOutlined />}
                      loading={isGeneratingImages}
                      onClick={handleGenerateImages}
                    >
                      生成图片
                    </Button>
                    <Button 
                      icon={<DownloadOutlined />}
                      onClick={handleSaveAsTask}
                    >
                      创建发布任务
                    </Button>
                    <Button 
                      type="primary"
                      icon={<SendOutlined />}
                      loading={isPublishing}
                      disabled={generatedImages.length === 0}
                      onClick={handlePublish}
                    >
                      一键发布
                    </Button>
                  </Space>
                )
              }
            >
              {generatedContent ? (
                <div className="space-y-4">
                  <div>
                    <Text strong>标题：</Text>
                    <Text>{generatedContent.title}</Text>
                  </div>
                  
                  <Divider />
                  
                  <div>
                    <Text strong>内容：</Text>
                    <div 
                      className="mt-2 p-3 bg-gray-50 rounded"
                      style={{ whiteSpace: 'pre-wrap' }}
                    >
                      {generatedContent.content || generatedContent.text}
                    </div>
                  </div>

                  {generatedContent.keywords && generatedContent.keywords.length > 0 && (
                    <div>
                      <Text strong>关键词：</Text>
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
                      <Text strong>生成的图片：</Text>
                      <Row gutter={[8, 8]} className="mt-2">
                        {generatedImages.map((image, index) => (
                          <Col span={8} key={index}>
                            <Image 
                              src={image} 
                              alt={`生成图片 ${index + 1}`}
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
                    填写内容信息后点击保存，即可创建新的内容记录
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
      <Title level={2}>内容管理</Title>
      
      <Tabs 
        defaultActiveKey="ai" 
        items={tabItems}
        size="large"
      />
    </div>
  );
};

export default ContentGenerator;