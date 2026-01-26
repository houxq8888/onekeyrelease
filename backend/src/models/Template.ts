import mongoose, { Document, Schema } from 'mongoose';

// 模板分类类型
export type TemplateCategory = '美食' | '旅行' | '美妆' | '穿搭' | '家居' | '育儿' | '其他';

// 模板接口
export interface ITemplate extends Document {
  name: string;
  category: TemplateCategory;
  description: string;
  titleStructure: string[]; // 标题结构，例如：['# 主标题', '## 副标题']
  contentFramework: string[]; // 正文框架，例如：['### 介绍', '### 主体内容', '### 总结']
  tagSuggestions: string[]; // 标签建议，例如：['美食', '推荐', '餐厅']
  imageCountSuggestion: number; // 图片数量建议
  isDefault: boolean; // 是否为系统默认模板
  createdBy: mongoose.Types.ObjectId; // 创建者用户ID
  createdAt: Date;
  updatedAt: Date;
}

// 模板收藏接口
export interface ITemplateFavorite extends Document {
  userId: mongoose.Types.ObjectId;
  templateId: mongoose.Types.ObjectId;
  createdAt: Date;
}

// 模板Schema
const TemplateSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  category: {
    type: String,
    required: true,
    enum: ['美食', '旅行', '美妆', '穿搭', '家居', '育儿', '其他']
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  titleStructure: {
    type: [String],
    required: true
  },
  contentFramework: {
    type: [String],
    required: true
  },
  tagSuggestions: {
    type: [String],
    required: true
  },
  imageCountSuggestion: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// 模板收藏Schema
const TemplateFavoriteSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'Template',
    required: true
  }
}, {
  timestamps: true
});

// 创建复合索引，确保每个用户只能收藏一次同一个模板
TemplateFavoriteSchema.index({ userId: 1, templateId: 1 }, { unique: true });

// 模型导出
export const Template = mongoose.model<ITemplate>('Template', TemplateSchema);
export const TemplateFavorite = mongoose.model<ITemplateFavorite>('TemplateFavorite', TemplateFavoriteSchema);
