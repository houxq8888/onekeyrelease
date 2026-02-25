import React, { useState } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  App,
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
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
  const { message } = App.useApp();

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
      message.success(t('contentHistory.deleteSuccess'));
      refetch();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || t('contentHistory.deleteFailed'));
    },
  });

  // 更新内容
  const updateMutation = useMutation(({ id, data }: { id: string; data: any }) => apiClient.content.update(id, data), {
    onSuccess: () => {
      message.success(t('contentHistory.updateSuccess'));
      setIsEditModalVisible(false);
      setEditingContent(null);
      form.resetFields();
      refetch();
    },
    onError: (error: any) => {
      message.error(error.response?.data?.error || t('contentHistory.updateFailed'));
    },
  });

  // 查看内容详情
  const handleViewContent = async (id: string) => {
    try {
      const response = await apiClient.content.get(id) as any;
      setSelectedContent(response.data);
      setIsModalVisible(true);
    } catch (error: any) {
      message.error(error.response?.data?.error || t('contentHistory.fetchDetailFailed'));
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
      message.error(error.response?.data?.error || t('contentHistory.fetchDetailFailed'));
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
      title: t('contentHistory.title'),
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 200,
    },
    {
      title: t('contentHistory.theme'),
      dataIndex: 'theme',
      key: 'theme',
      width: 120,
    },
    {
      title: t('contentHistory.audience'),
      dataIndex: 'targetAudience',
      key: 'targetAudience',
      width: 100,
    },
    {
      title: t('contentHistory.style'),
      dataIndex: 'style',
      key: 'style',
      width: 80,
      render: (style: string) => {
        const styleMap: Record<string, string> = {
          formal: t('contentGenerator.formal'),
          casual: t('contentGenerator.casual'),
          professional: t('contentGenerator.professional'),
          creative: t('contentGenerator.creative'),
        };
        return styleMap[style] || style;
      },
    },
    {
      title: t('contentHistory.status'),
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          generated: { color: 'blue', text: t('contentHistory.generated') },
          published: { color: 'green', text: t('contentHistory.published') },
          failed: { color: 'red', text: t('contentHistory.failed') },
        };
        const statusInfo = statusMap[status] || { color: 'default', text: status };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
    },
    {
      title: t('contentHistory.generatedAt'),
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: t('contentHistory.action'),
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
            {t('contentHistory.view')}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditContent(record._id)}
          >
            {t('contentHistory.edit')}
          </Button>
          <Popconfirm
            title={t('contentHistory.confirmDelete')}
            description={t('contentHistory.confirmDeleteDesc')}
            onConfirm={() => handleDeleteContent(record._id)}
            okText={t('common.ok')}
            cancelText={t('common.cancel')}
          >
            <Button
              type="link"
              danger
              size="small"
              icon={<DeleteOutlined />}
              loading={deleteMutation.isLoading}
            >
              {t('contentHistory.delete')}
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
        <Title level={2}>{t('contentHistory.title')}</Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => refetch()}
          loading={isLoading}
        >
          {t('contentHistory.refresh')}
        </Button>
      </div>

      {/* 搜索区域 */}
      <Card>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Input
              placeholder={t('contentHistory.searchTheme')}
              prefix={<SearchOutlined />}
              value={searchParams.theme}
              onChange={(e) => handleSearch('theme', e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8}>
            <Select
              placeholder={t('contentHistory.selectStatus')}
              style={{ width: '100%' }}
              value={searchParams.status || undefined}
              onChange={(value) => handleSearch('status', value)}
              allowClear
            >
              <Option value="generated">{t('contentHistory.generated')}</Option>
              <Option value="published">{t('contentHistory.published')}</Option>
              <Option value="failed">{t('contentHistory.failed')}</Option>
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
              t('contentHistory.pagination', { 0: range[0], 1: range[1], 2: total }),
            onChange: handlePageChange,
          }}
        />
      </Card>

      {/* 内容详情模态框 */}
      <Modal
        title={t('contentHistory.detailTitle')}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            {t('common.close')}
          </Button>,
        ]}
        width={800}
      >
        {selectedContent && (
          <div className="space-y-4">
            <div>
              <Text strong>{t('contentHistory.title')}：</Text>
              <Text>{selectedContent.title}</Text>
            </div>
            
            <div>
              <Text strong>{t('contentHistory.theme')}：</Text>
              <Text>{selectedContent.theme}</Text>
            </div>
            
            <div>
              <Text strong>{t('contentHistory.audience')}：</Text>
              <Text>{selectedContent.targetAudience}</Text>
            </div>
            
            <div>
              <Text strong>{t('contentHistory.style')}：</Text>
              <Text>
                {selectedContent.style === 'formal' ? t('contentGenerator.formal') :
                 selectedContent.style === 'casual' ? t('contentGenerator.casual') :
                 selectedContent.style === 'professional' ? t('contentGenerator.professional') :
                 selectedContent.style === 'creative' ? t('contentGenerator.creative') : selectedContent.style}
              </Text>
            </div>
            
            <Divider />
            
            <div>
              <Text strong>{t('contentHistory.resultContent')}：</Text>
              <div 
                className="mt-2 p-3 bg-gray-50 rounded"
                style={{ whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}
              >
                {selectedContent.content}
              </div>
            </div>

            {selectedContent.hashtags && selectedContent.hashtags.length > 0 && (
              <div>
                <Text strong>{t('contentHistory.resultHashtags')}：</Text>
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
              <Text strong>{t('contentHistory.resultSummary')}：</Text>
              <Text>{selectedContent.summary}</Text>
            </div>
            
            <div>
              <Text strong>{t('contentHistory.generatedAt')}：</Text>
              <Text>{new Date(selectedContent.generatedAt).toLocaleString()}</Text>
            </div>
            
            {selectedContent.publishedAt && (
              <div>
                <Text strong>{t('tasks.publishTime')}：</Text>
                <Text>{new Date(selectedContent.publishedAt).toLocaleString()}</Text>
              </div>
            )}
            
            {selectedContent.publishUrl && (
              <div>
                <Text strong>{t('contentHistory.publishUrl')}：</Text>
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
        title={t('contentHistory.editTitle')}
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
            label={t('contentHistory.title')}
            rules={[{ required: true, message: t('contentHistory.titlePlaceholder') }]}
          >
            <Input placeholder={t('contentHistory.titlePlaceholder')} />
          </Form.Item>

          <Form.Item
            name="content"
            label={t('contentHistory.resultContent')}
            rules={[{ required: true, message: t('contentHistory.contentPlaceholder') }]}
          >
            <Input.TextArea 
              placeholder={t('contentHistory.contentPlaceholder')}
              rows={8}
              style={{ whiteSpace: 'pre-wrap' }}
            />
          </Form.Item>

          <Form.Item
            name="hashtags"
            label={t('contentHistory.resultHashtags')}
            extra={t('contentHistory.hashtagsExtra')}
          >
            <Input placeholder={t('contentHistory.hashtagsPlaceholder')} />
          </Form.Item>

          <Form.Item
            name="summary"
            label={t('contentHistory.resultSummary')}
          >
            <Input.TextArea 
              placeholder={t('contentHistory.summaryPlaceholder')}
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
                {t('contentHistory.saveEdit')}
              </Button>
              <Button 
                onClick={() => {
                  setIsEditModalVisible(false);
                  setEditingContent(null);
                  form.resetFields();
                }}
              >
                {t('common.cancel')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ContentHistory;