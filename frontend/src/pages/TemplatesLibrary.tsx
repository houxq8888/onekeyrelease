import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Space, Tag, Divider, Empty, Spin, Alert, Tooltip, Modal } from 'antd';
import { SearchOutlined, StarOutlined, StarFilled, EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { Template, TemplateCategory, TemplateFilter } from '../types';
import { apiClient } from '../utils/api';

const { Search } = Input;
const { Option } = Select;

// 预设分类列表
const CATEGORIES: TemplateCategory[] = ['美食', '旅行', '美妆', '穿搭', '家居', '育儿', '其他'];

const TemplatesLibrary: React.FC = () => {
  // 状态管理
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters] = useState<TemplateFilter>({});
  const [searchValue, setSearchValue] = useState('');
  const [categoryValue, setCategoryValue] = useState<TemplateCategory | undefined>();
  const [isFavoriteFilter, setIsFavoriteFilter] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  // 获取模板列表
  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        ...filters,
        search: searchValue || undefined,
        category: categoryValue || undefined,
        isFavorite: isFavoriteFilter ? 'true' : undefined
      };
      const response = await apiClient.templates.list(params);
      if (response.data.success && response.data.data) {
        setTemplates(response.data.data);
      } else {
        throw new Error(response.data.error || '获取模板列表失败');
      }
    } catch (err: any) {
      console.error('获取模板列表失败:', err);
      setError(err.message || '获取模板列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化和筛选变化时重新获取模板
  useEffect(() => {
    fetchTemplates();
  }, [filters, searchValue, categoryValue, isFavoriteFilter]);

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchValue(value);
  };

  // 处理分类筛选
  const handleCategoryChange = (value: TemplateCategory | undefined) => {
    setCategoryValue(value);
  };

  // 处理收藏筛选
  const handleFavoriteFilterChange = (checked: boolean) => {
    setIsFavoriteFilter(checked);
  };

  // 处理模板收藏
  const handleToggleFavorite = async (templateId: string) => {
    try {
      const isFavorite = templates.some(t => t.id === templateId && (t as any).isFavorite);
      if (isFavorite) {
        await apiClient.templates.unfavorite(templateId);
      } else {
        await apiClient.templates.favorite(templateId);
      }
      // 刷新模板列表
      fetchTemplates();
    } catch (err: any) {
      console.error('收藏模板失败:', err);
      setError(err.message || '收藏模板失败');
    }
  };

  // 处理模板预览
  const handlePreview = (template: Template) => {
    setSelectedTemplate(template);
    setPreviewVisible(true);
  };

  // 处理模板删除
  const handleDelete = async () => {
    if (!templateToDelete) return;
    try {
      await apiClient.templates.delete(templateToDelete);
      // 刷新模板列表
      fetchTemplates();
      setDeleteConfirmVisible(false);
      setTemplateToDelete(null);
    } catch (err: any) {
      console.error('删除模板失败:', err);
      setError(err.message || '删除模板失败');
    }
  };

  // 打开删除确认对话框
  const openDeleteConfirm = (templateId: string) => {
    setTemplateToDelete(templateId);
    setDeleteConfirmVisible(true);
  };

  // 关闭预览模态框
  const handlePreviewClose = () => {
    setPreviewVisible(false);
    setSelectedTemplate(null);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">模板库</h1>
        <p className="text-gray-600">管理和使用预设的内容模板</p>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}

      {/* 筛选栏 */}
      <Card className="mb-6">
        <Space wrap size="middle" className="w-full">
          <Search
            placeholder="搜索模板名称或描述"
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-64"
          />
          <Select
            placeholder="选择分类"
            allowClear
            size="middle"
            style={{ width: 150 }}
            onChange={handleCategoryChange}
            value={categoryValue || undefined}
          >
            {CATEGORIES.map(category => (
              <Option key={category} value={category}>{category}</Option>
            ))}
          </Select>
          <Space>
            <Button
              type={isFavoriteFilter ? 'primary' : 'default'}
              icon={<StarOutlined />}
              onClick={() => handleFavoriteFilterChange(!isFavoriteFilter)}
            >
              仅显示收藏
            </Button>
            <Button type="primary" icon={<PlusOutlined />}>
              创建模板
            </Button>
          </Space>
        </Space>
      </Card>

      {/* 模板列表 */}
      <Spin spinning={loading} tip="加载中...">
        {templates.length === 0 ? (
          <Empty
            description="暂无模板"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => {
              const isFavorite = (template as any).isFavorite;
              return (
                <Card
                  key={template.id}
                  hoverable
                  className="transition-all duration-300 hover:shadow-lg"
                  extra={(
                    <Space size="small">
                      <Tooltip title="预览">
                        <Button
                          type="text"
                          icon={<EyeOutlined />}
                          onClick={() => handlePreview(template)}
                        />
                      </Tooltip>
                      {!template.isDefault && (
                        <Tooltip title="编辑">
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                          />
                        </Tooltip>
                      )}
                      {!template.isDefault && (
                        <Tooltip title="删除">
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => openDeleteConfirm(template.id)}
                          />
                        </Tooltip>
                      )}
                    </Space>
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold">{template.name}</h3>
                    <Button
                      type="text"
                      icon={isFavorite ? <StarFilled /> : <StarOutlined />}
                      onClick={() => handleToggleFavorite(template.id)}
                      style={{ color: isFavorite ? '#faad14' : undefined }}
                    />
                  </div>
                  <Tag color="blue" className="mb-2">{template.category}</Tag>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{template.description}</p>
                  <Divider className="my-2" />
                  <div className="text-sm">
                    <p><strong>标题结构:</strong> {template.titleStructure.length} 层</p>
                    <p><strong>正文框架:</strong> {template.contentFramework.length} 部分</p>
                    <p><strong>图片建议:</strong> {template.imageCountSuggestion} 张</p>
                    {template.tagSuggestions.length > 0 && (
                      <p>
                        <strong>标签建议:</strong> {template.tagSuggestions.slice(0, 3).join('、')}
                        {template.tagSuggestions.length > 3 && '...'}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    <p>创建时间: {new Date(template.createdAt).toLocaleString()}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Spin>

      {/* 模板预览模态框 */}
      <Modal
        title="模板预览"
        visible={previewVisible}
        onCancel={handlePreviewClose}
        footer={null}
        width={800}
      >
        {selectedTemplate && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{selectedTemplate.name}</h3>
              <Tag color="blue">{selectedTemplate.category}</Tag>
            </div>
            <p className="text-gray-600 mb-4">{selectedTemplate.description}</p>
            
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">标题结构</h4>
              <div className="bg-gray-50 p-4 rounded">
                {selectedTemplate.titleStructure.map((title, index) => (
                  <p key={index} className="mb-1">{title}</p>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">正文框架</h4>
              <div className="bg-gray-50 p-4 rounded">
                {selectedTemplate.contentFramework.map((section, index) => (
                  <p key={index} className="mb-1">{section}</p>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">标签建议</h4>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.tagSuggestions.map((tag, index) => (
                  <Tag key={index} color="gray">{tag}</Tag>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">图片数量建议</h4>
              <p className="text-gray-800">{selectedTemplate.imageCountSuggestion} 张</p>
            </div>
          </div>
        )}
      </Modal>

      {/* 删除确认模态框 */}
      <Modal
        title="确认删除"
        visible={deleteConfirmVisible}
        onCancel={() => setDeleteConfirmVisible(false)}
        onOk={handleDelete}
        okText="删除"
        cancelText="取消"
        okType="danger"
      >
        <p>确定要删除该模板吗？此操作无法撤销。</p>
      </Modal>
    </div>
  );
};

export default TemplatesLibrary;
