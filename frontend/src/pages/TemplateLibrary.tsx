import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  List, 
  Tag, 
  Modal, 
  Space, 
  Input, 
  Select, 
  Checkbox, 
  message, 
  Typography, 
  Row, 
  Col,
  Empty,
  Spin,
  Tooltip
} from 'antd';
import { 
  StarOutlined, 
  StarFilled, 
  EyeOutlined, 
  PlusOutlined,
  FilterOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { apiClient } from '../utils/api';
import type { Template } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

const TemplateLibrary: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterForm, setFilterForm] = useState({
    category: '',
    isFavorite: false,
    isPreset: false
  });
  
  const queryClient = useQueryClient();

  // 获取模板列表
  const { data: templates, isLoading } = useQuery(
    ['templates', filterForm, searchKeyword],
    async () => {
      const params = {
        ...filterForm,
        ...(searchKeyword && { search: searchKeyword })
      };
      const response = await apiClient.templates.list(params);
      return response.data as Template[];
    },
    {
      keepPreviousData: true
    }
  );

  // 获取模板分类
  const { data: categories } = useQuery(
    ['templateCategories'],
    async () => {
      const response = await apiClient.templates.getCategories();
      return response.data as string[];
    }
  );

  // 收藏模板Mutation
  const toggleFavoriteMutation = useMutation(
    (id: string) => apiClient.templates.toggleFavorite(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['templates']);
        message.success('模板收藏状态已更新');
      },
      onError: (error: any) => {
        message.error(error.response?.data?.error || '收藏状态更新失败');
      }
    }
  );

  // 切换收藏状态
  const handleToggleFavorite = (id: string) => {
    toggleFavoriteMutation.mutate(id);
  };

  // 预览模板
  const handlePreviewTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setPreviewVisible(true);
  };

  // 使用模板
  const handleUseTemplate = (template: Template) => {
    // 这里可以实现模板使用的逻辑，例如跳转到内容生成页面并填充模板内容
    message.success(`已选择模板: ${template.name}`);
    // 示例：跳转到内容生成页面
    // window.location.href = '/content-generator?templateId=' + template._id;
  };

  // 关闭预览
  const handlePreviewClose = () => {
    setPreviewVisible(false);
    setSelectedTemplate(null);
  };

  // 打开筛选面板
  const handleFilterOpen = () => {
    setFilterVisible(true);
  };

  // 关闭筛选面板
  const handleFilterClose = () => {
    setFilterVisible(false);
  };

  // 应用筛选条件
  const handleFilterApply = () => {
    setFilterVisible(false);
  };

  // 重置筛选条件
  const handleFilterReset = () => {
    setFilterForm({
      category: '',
      isFavorite: false,
      isPreset: false
    });
    setSearchKeyword('');
  };

  // 渲染模板列表
  const renderTemplateList = () => {
    if (isLoading) {
      return (
        <div className="text-center py-12">
          <Spin size="large" />
        </div>
      );
    }

    if (!templates || templates.length === 0) {
      return (
        <div className="text-center py-12">
          <Empty 
            description="暂无模板数据"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      );
    }

    return (
      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
        dataSource={templates}
        renderItem={(template) => (
          <List.Item key={template._id}>
            <Card
              hoverable
              cover={
                <div className="h-40 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
                  <Text type="secondary" className="text-lg">
                    {template.name}
                  </Text>
                </div>
              }
              actions={[
                <Tooltip title={template.isFavorite ? '取消收藏' : '收藏模板'}>
                  <Button 
                    icon={template.isFavorite ? <StarFilled /> : <StarOutlined />}
                    onClick={() => handleToggleFavorite(template._id)}
                    type={template.isFavorite ? 'primary' : 'default'}
                  />
                </Tooltip>,
                <Tooltip title="预览模板">
                  <Button icon={<EyeOutlined />} onClick={() => handlePreviewTemplate(template)} />
                </Tooltip>,
                <Tooltip title="使用模板">
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />} 
                    onClick={() => handleUseTemplate(template)}
                  />
                </Tooltip>
              ]}
            >
              <Card.Meta
                title={template.name}
                description={
                  <div className="space-y-2">
                    <Tag color="blue">{template.category}</Tag>
                    <div>
                      <Text strong>图片数量:</Text>
                      <Text> {template.imageCountSuggestion}张</Text>
                    </div>
                    {template.description && (
                      <Text type="secondary" ellipsis>
                        {template.description}
                      </Text>
                    )}
                  </div>
                }
              />
            </Card>
          </List.Item>
        )}
      />
    );
  };

  // 渲染模板预览
  const renderTemplatePreview = () => {
    if (!selectedTemplate) return null;

    return (
      <Modal
        title="模板预览"
        visible={previewVisible}
        onCancel={handlePreviewClose}
        footer={[
          <Button key="back" onClick={handlePreviewClose}>
            关闭
          </Button>,
          <Button key="use" type="primary" onClick={() => handleUseTemplate(selectedTemplate)}>
            使用模板
          </Button>
        ]}
        width={800}
      >
        <div className="space-y-6">
          <div>
            <Title level={4}>模板信息</Title>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Text strong>模板名称:</Text>
                <Text> {selectedTemplate.name}</Text>
              </Col>
              <Col span={8}>
                <Text strong>分类:</Text>
                <Tag color="blue">{selectedTemplate.category}</Tag>
              </Col>
              <Col span={8}>
                <Text strong>图片数量建议:</Text>
                <Text> {selectedTemplate.imageCountSuggestion}张</Text>
              </Col>
            </Row>
            {selectedTemplate.description && (
              <div className="mt-4">
                <Text strong>模板描述:</Text>
                <Text> {selectedTemplate.description}</Text>
              </div>
            )}
          </div>

          <div>
            <Title level={4}>标题结构</Title>
            <div className="p-4 bg-gray-50 rounded">
              {selectedTemplate.titleStructure}
            </div>
          </div>

          <div>
            <Title level={4}>正文框架</Title>
            <div className="p-4 bg-gray-50 rounded" style={{ whiteSpace: 'pre-wrap' }}>
              {selectedTemplate.contentFramework}
            </div>
          </div>

          {selectedTemplate.tagSuggestions && selectedTemplate.tagSuggestions.length > 0 && (
            <div>
              <Title level={4}>标签建议</Title>
              <div className="mt-2">
                {selectedTemplate.tagSuggestions.map((tag, index) => (
                  <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-2">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    );
  };

  // 渲染筛选面板
  const renderFilterPanel = () => {
    return (
      <Modal
        title="筛选模板"
        visible={filterVisible}
        onCancel={handleFilterClose}
        footer={[
          <Button key="back" onClick={handleFilterClose}>
            取消
          </Button>,
          <Button key="reset" onClick={handleFilterReset}>
            重置
          </Button>,
          <Button key="submit" type="primary" onClick={handleFilterApply}>
            应用
          </Button>
        ]}
      >
        <div className="space-y-4">
          <div>
            <Text strong>分类</Text>
            <Select
              value={filterForm.category}
              onChange={(value) => setFilterForm({ ...filterForm, category: value })}
              placeholder="选择分类"
              style={{ width: '100%' }}
            >
              {categories && categories.map((category) => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </div>
          <div>
            <Checkbox 
              checked={filterForm.isFavorite}
              onChange={(e) => setFilterForm({ ...filterForm, isFavorite: e.target.checked })}
            >
              只显示收藏的模板
            </Checkbox>
          </div>
          <div>
            <Checkbox 
              checked={filterForm.isPreset}
              onChange={(e) => setFilterForm({ ...filterForm, isPreset: e.target.checked })}
            >
              只显示预设模板
            </Checkbox>
          </div>
        </div>
      </Modal>
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <Title level={2}>模板库</Title>
        <Space>
          <Input 
            placeholder="搜索模板名称或描述"
            prefix={<SearchOutlined />}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            style={{ width: 300 }}
          />
          <Button 
            icon={<FilterOutlined />} 
            onClick={handleFilterOpen}
          >
            筛选
          </Button>
          <Button type="primary">
            创建模板
          </Button>
        </Space>
      </div>

      {/* 模板列表 */}
      {renderTemplateList()}

      {/* 模板预览 */}
      {renderTemplatePreview()}

      {/* 筛选面板 */}
      {renderFilterPanel()}
    </div>
  );
};

export default TemplateLibrary;