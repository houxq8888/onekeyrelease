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
  Divider 
} from 'antd';
import { 
  RocketOutlined, 
  DownloadOutlined,
  PlusOutlined 
} from '@ant-design/icons';
import { useMutation } from 'react-query';
import { apiClient } from '@utils/api';
import type { GenerationConfig } from '@types';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ContentGenerator: React.FC = () => {
  const [form] = Form.useForm();
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // 内容生成Mutation
  const generateMutation = useMutation(apiClient.content.generate, {
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: (response) => {
      setGeneratedContent(response.data);
      message.success('内容生成成功！');
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '内容生成失败');
    },
    onSettled: () => {
      setIsGenerating(false);
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
    }).catch((error) => {
      message.error('创建任务失败');
    });
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

  return (
    <div className="space-y-6">
      <Title level={2}>内容生成</Title>
      
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
                    icon={<DownloadOutlined />}
                    onClick={handleSaveAsTask}
                  >
                    创建发布任务
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
                    {generatedContent.text}
                  </div>
                </div>

                {generatedContent.tags && generatedContent.tags.length > 0 && (
                  <div>
                    <Text strong>话题标签：</Text>
                    <div className="mt-2">
                      {generatedContent.tags.map((tag: string, index: number) => (
                        <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-2">
                          #{tag}
                        </span>
                      ))}
                    </div>
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
    </div>
  );
};

export default ContentGenerator;