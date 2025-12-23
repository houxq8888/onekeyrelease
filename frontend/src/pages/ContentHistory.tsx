import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  message,
  Popconfirm,
  Input,
  Select,
  Row,
  Col,
  Divider,
  Form,
} from 'antd';
import {
  EyeOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation } from 'react-query';
import { apiClient } from '../utils/api';

const { Title, Text } = Typography;
const { Option } = Select;

interface Content {
  _id: string;
  title: string;
  content: string;
  hashtags: string[];
  summary: string;
  theme: string;
  keywords: string[];
  targetAudience: string;
  style: string;
  wordCount: number;
  images: string[];
  video: string;
  platform: string;
  generatedAt: string;
  publishedAt?: string;
  publishUrl?: string;
  status: 'generated' | 'published' | 'failed';
}

const ContentHistory: React.FC = () => {
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [searchParams, setSearchParams] = useState({
    page: 1,
    limit: 10,
    theme: '',
    status: '',
  });
  const [form] = Form.useForm();

  // 获取内容列表
  const {
    data: contentData,
    isLoading,
    refetch,
  } = useQuery(['content', searchParams], () =>
    apiClient.content.list(searchParams)
  );

  // 删除内容
  const deleteMutation = useMutation((id: string) => apiClient.content.delete(id), {
    onSuccess: () => {
      message.success('内容删除成功');
      refetch();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '删除失败');
    },
  });

  // 更新内容
  const updateMutation = useMutation(({ id, data }: { id: string; data: any }) => apiClient.content.update(id, data), {
    onSuccess: () => {
      message.success('内容更新成功');
      setIsEditModalVisible(false);
      setEditingContent(null);
      form.resetFields();
      refetch();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || '更新失败');
    },
  });

  // 查看内容详情
  const handleViewContent = async (id: string) => {
    try {
      const response = await apiClient.content.get(id) as any;
      setSelectedContent(response.data);
      setIsModalVisible(true);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取内容详情失败');
    }
  };

  // 删除内容确认
  const handleDeleteContent = (id: string) => {
    deleteMutation.mutate(id);
  };

  // 编辑内容
  const handleEditContent = async (id: string) => {
    try {
      const response = await apiClient.content.get(id) as any;
      setEditingContent(response.data);
      form.setFieldsValue({
        title: response.data.title,
        content: response.data.content,
        hashtags: response.data.hashtags?.join(', '),
        summary: response.data.summary,
      });
      setIsEditModalVisible(true);
    } catch (error: any) {
      message.error(error.response?.data?.error || '获取内容详情失败');
    }
  };

  // 提交编辑
  const handleEditSubmit = (values: any) => {
    if (!editingContent) return;
    
    const updatedContent = {
      title: values.title,
      content: values.content,
      hashtags: values.hashtags.split(/[,，]/).map((tag: string) => tag.trim()).filter((tag: string) => tag),
      summary: values.summary,
    };
    
    updateMutation.mutate({ id: editingContent._id, data: updatedContent } as any);
  };

  // 搜索处理
  const handleSearch = (field: string, value: string) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value,
      page: 1, // 重置到第一页
    }));
  };

  // 分页处理
  const handlePageChange = (page: number, pageSize?: number) => {
    setSearchParams(prev => ({
      ...prev,
      page,
      limit: pageSize || prev.limit,
    }));
  };

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 200,
    },
    {
      title: '主题',
      dataIndex: 'theme',
      key: 'theme',
      width: 120,
    },
    {
      title: '目标受众',
      dataIndex: 'targetAudience',
      key: 'targetAudience',
      width: 100,
    },
    {
      title: '风格',
      dataIndex: 'style',
      key: 'style',
      width: 80,
      render: (style: string) => {
        const styleMap: Record<string, string> = {
          formal: '正式',
          casual: '轻松',
          professional: '专业',
          creative: '创意',
        };
        return styleMap[style] || style;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          generated: { color: 'blue', text: '已生成' },
          published: { color: 'green', text: '已发布' },
          failed: { color: 'red', text: '失败' },
        };
        const statusInfo = statusMap[status] || { color: 'default', text: status };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: '生成时间',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: Content) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewContent(record._id)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditContent(record._id)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确认删除"
            description="确定要删除这个内容吗？"
            onConfirm={() => handleDeleteContent(record._id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
              loading={deleteMutation.isLoading}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const contents = (contentData as any)?.data?.contents || [];
  const pagination = (contentData as any)?.data?.pagination || {};

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex justify-between items-center">
        <Title level={2}>历史内容</Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => refetch()}
          loading={isLoading}
        >
          刷新
        </Button>
      </div>

      {/* 搜索区域 */}
      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Input
              placeholder="搜索主题"
              prefix={<SearchOutlined />}
              value={searchParams.theme}
              onChange={(e) => handleSearch('theme', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8}>
            <Select
              placeholder="选择状态"
              style={{ width: '100%' }}
              value={searchParams.status || undefined}
              onChange={(value) => handleSearch('status', value)}
              allowClear
            >
              <Option value="generated">已生成</Option>
              <Option value="published">已发布</Option>
              <Option value="failed">失败</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* 内容列表 */}
      <Card>
        <Table
          columns={columns}
          dataSource={contents}
          rowKey="_id"
          loading={isLoading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: handlePageChange,
          }}
        />
      </Card>

      {/* 内容详情模态框 */}
      <Modal
        title="内容详情"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {selectedContent && (
          <div className="space-y-4">
            <div>
              <Text strong>标题：</Text>
              <Text>{selectedContent.title}</Text>
            </div>
            
            <div>
              <Text strong>主题：</Text>
              <Text>{selectedContent.theme}</Text>
            </div>
            
            <div>
              <Text strong>目标受众：</Text>
              <Text>{selectedContent.targetAudience}</Text>
            </div>
            
            <div>
              <Text strong>风格：</Text>
              <Text>
                {selectedContent.style === 'formal' ? '正式' :
                 selectedContent.style === 'casual' ? '轻松' :
                 selectedContent.style === 'professional' ? '专业' :
                 selectedContent.style === 'creative' ? '创意' : selectedContent.style}
              </Text>
            </div>
            
            <Divider />
            
            <div>
              <Text strong>内容：</Text>
              <div 
                className="mt-2 p-3 bg-gray-50 rounded"
                style={{ whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}
              >
                {selectedContent.content}
              </div>
            </div>

            {selectedContent.hashtags && selectedContent.hashtags.length > 0 && (
              <div>
                <Text strong>话题标签：</Text>
                <div className="mt-2">
                  {selectedContent.hashtags.map((tag: string, index: number) => (
                    <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-2">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <Text strong>摘要：</Text>
              <Text>{selectedContent.summary}</Text>
            </div>
            
            <div>
              <Text strong>生成时间：</Text>
              <Text>{new Date(selectedContent.generatedAt).toLocaleString()}</Text>
            </div>
            
            {selectedContent.publishedAt && (
              <div>
                <Text strong>发布时间：</Text>
                <Text>{new Date(selectedContent.publishedAt).toLocaleString()}</Text>
              </div>
            )}
            
            {selectedContent.publishUrl && (
              <div>
                <Text strong>发布链接：</Text>
                <a href={selectedContent.publishUrl} target="_blank" rel="noopener noreferrer">
                  {selectedContent.publishUrl}
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 编辑内容模态框 */}
      <Modal
        title="编辑内容"
        open={isEditModalVisible}
        onCancel={() => {
          setIsEditModalVisible(false);
          setEditingContent(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
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
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <Input.TextArea 
              placeholder="请输入内容正文"
              rows={8}
              style={{ whiteSpace: 'pre-wrap' }}
            />
          </Form.Item>

          <Form.Item
            name="hashtags"
            label="话题标签"
            extra="多个标签用逗号分隔"
          >
            <Input placeholder="例如：美食,旅行,生活" />
          </Form.Item>

          <Form.Item
            name="summary"
            label="摘要"
          >
            <Input.TextArea 
              placeholder="请输入内容摘要"
              rows={3}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={updateMutation.isLoading}
              >
                保存修改
              </Button>
              <Button 
                onClick={() => {
                  setIsEditModalVisible(false);
                  setEditingContent(null);
                  form.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContentHistory;