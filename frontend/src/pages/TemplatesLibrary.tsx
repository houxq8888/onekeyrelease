import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Space, Tag, Divider, Empty, Spin, Alert, Tooltip, Modal } from 'antd';
import { SearchOutlined, StarOutlined, StarFilled, EyeOutlined, EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { Template, TemplateCategory, TemplateFilter } from '../types';
import { apiClient } from '../utils/api';
import { useTranslation } from 'react-i18next';

const { Search } = Input;
const { Option } = Select;

const TemplatesLibrary: React.FC = () => {
  const { t } = useTranslation();
  const CATEGORIES: TemplateCategory[] = ['food', 'travel', 'beauty', 'fashion', 'home', 'parenting', 'other'];
  const getCategoryLabel = (category: string) => t(`templates.categories.${category}`);
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
      if (response.data) {
        setTemplates(Array.isArray(response.data) ? response.data : []);
      } else {
        throw new Error(t('templates.fetchFailed'));
      }
    } catch (err: any) {
      console.error('获取模板列表失败:', err);
      setError(err.message || t('templates.fetchFailed'));
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
      setError(err.message || t('templates.favoriteFailed'));
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
      setError(err.message || t('templates.deleteFailed'));
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
        <h1 className="text-2xl font-bold mb-2">{t('templates.title')}</h1>
        <p className="text-gray-600">{t('templates.subtitle')}</p>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert
          message={t('templates.error')}
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
            placeholder={t('templates.searchPlaceholder')}
            allowClear
            enterButton={<SearchOutlined />}
            size="middle"
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-64"
          />
          <Select
            placeholder={t('templates.selectCategory')}
            allowClear
            size="middle"
            style={{ width: 150 }}
            onChange={handleCategoryChange}
            value={categoryValue || undefined}
          >
            {CATEGORIES.map(category => (
              <Option key={category} value={category}>{getCategoryLabel(category)}</Option>
            ))}
          </Select>
          <Space>
            <Button
              type={isFavoriteFilter ? 'primary' : 'default'}
              icon={<StarOutlined />}
              onClick={() => handleFavoriteFilterChange(!isFavoriteFilter)}
            >
              {t('templates.showFavoritesOnly')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />}>
              {t('templates.createTemplate')}
            </Button>
          </Space>
        </Space>
      </Card>

      {/* 模板列表 */}
      <Spin spinning={loading} tip={t('templates.loading')}>
        {templates.length === 0 ? (
          <Empty
            description={t('templates.noTemplates')}
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
                      <Tooltip title={t('templates.preview')}>
                        <Button
                          type="text"
                          icon={<EyeOutlined />}
                          onClick={() => handlePreview(template)}
                        />
                      </Tooltip>
                      {!template.isDefault && (
                        <Tooltip title={t('templates.edit')}>
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                          />
                        </Tooltip>
                      )}
                      {!template.isDefault && (
                        <Tooltip title={t('templates.delete')}>
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
                  <Tag color="blue" className="mb-2">{getCategoryLabel(template.category)}</Tag>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{template.description}</p>
                  <Divider className="my-2" />
                  <div className="text-sm">
                    <p><strong>{t('templates.titleStructure')}:</strong> {template.titleStructure.length} {t('templates.layers')}</p>
                    <p><strong>{t('templates.contentFramework')}:</strong> {template.contentFramework.length} {t('templates.parts')}</p>
                    <p><strong>{t('templates.imageCount')}:</strong> {template.imageCountSuggestion} {t('templates.images')}</p>
                    {template.tagSuggestions.length > 0 && (
                      <p>
                        <strong>{t('templates.tagSuggestions')}:</strong> {template.tagSuggestions.slice(0, 3).join('、')}
                        {template.tagSuggestions.length > 3 && '...'}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 text-xs text-gray-500">
                    <p>{t('templates.createdAt')}: {new Date(template.createdAt).toLocaleString()}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </Spin>

      {/* 模板预览模态框 */}
      <Modal
        title={t('templates.previewTitle')}
        visible={previewVisible}
        onCancel={handlePreviewClose}
        footer={null}
        width={800}
      >
        {selectedTemplate && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{selectedTemplate.name}</h3>
              <Tag color="blue">{getCategoryLabel(selectedTemplate.category)}</Tag>
            </div>
            <p className="text-gray-600 mb-4">{selectedTemplate.description}</p>
            
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">{t('templates.titleStructure')}</h4>
              <div className="bg-gray-50 p-4 rounded">
                {selectedTemplate.titleStructure.map((title, index) => (
                  <p key={index} className="mb-1">{title}</p>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">{t('templates.contentFramework')}</h4>
              <div className="bg-gray-50 p-4 rounded">
                {selectedTemplate.contentFramework.map((section, index) => (
                  <p key={index} className="mb-1">{section}</p>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">{t('templates.tagSuggestions')}</h4>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.tagSuggestions.map((tag, index) => (
                  <Tag key={index} color="gray">{tag}</Tag>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-2">{t('templates.imageCount')}</h4>
              <p className="text-gray-800">{selectedTemplate.imageCountSuggestion} {t('templates.images')}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* 删除确认模态框 */}
      <Modal
        title={t('templates.confirmDelete')}
        visible={deleteConfirmVisible}
        onCancel={() => setDeleteConfirmVisible(false)}
        onOk={handleDelete}
        okText={t('templates.delete')}
        cancelText={t('templates.cancel')}
        okType="danger"
      >
        <p>{t('templates.deleteConfirmMessage')}</p>
      </Modal>
    </div>
  );
};

export default TemplatesLibrary;
