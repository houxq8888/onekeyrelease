import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { Template, ITemplate } from '../models/Template';
import mongoose from 'mongoose';

export interface CreateTemplateDto {
  name: string;
  category: '美食' | '旅行' | '美妆' | '穿搭' | '家居' | '育儿' | '其他';
  titleStructure: string;
  contentFramework: string;
  tagSuggestions: string[];
  imageCountSuggestion: number;
  description?: string;
  isPreset?: boolean;
  isFavorite?: boolean;
  createdBy: string;
}

export interface UpdateTemplateDto {
  name?: string;
  category?: '美食' | '旅行' | '美妆' | '穿搭' | '家居' | '育儿' | '其他';
  titleStructure?: string;
  contentFramework?: string;
  tagSuggestions?: string[];
  imageCountSuggestion?: number;
  description?: string;
  isFavorite?: boolean;
}

export class TemplateService {
  /**
   * 创建模板
   */
  static async createTemplate(dto: CreateTemplateDto): Promise<ITemplate> {
    try {
      logger.info(`开始创建模板: ${dto.name}`);
      
      // 检查模板名称是否已存在
      const existingTemplate = await Template.findOne({ name: dto.name });
      if (existingTemplate) {
        throw new AppError('模板名称已存在', 400);
      }
      
      // 创建模板
      const template = new Template({
        ...dto,
        createdBy: new mongoose.Types.ObjectId(dto.createdBy),
      });
      
      await template.save();
      
      logger.info(`模板创建成功: ${template._id}`);
      return template;
    } catch (error: any) {
      logger.error(`模板创建失败: ${error.message}`);
      throw new AppError(`模板创建失败: ${error.message}`, 500);
    }
  }

  /**
   * 获取模板列表
   */
  static async getTemplates(filter: any = {}, page = 1, limit = 10): Promise<{ templates: ITemplate[]; total: number }> {
    try {
      logger.info(`获取模板列表，过滤条件: ${JSON.stringify(filter)}`);
      
      // 构建查询条件
      const query = Template.find(filter);
      
      // 分页查询
      const templates = await query
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('createdBy', 'username');
      
      // 获取总数
      const total = await Template.countDocuments(filter);
      
      logger.info(`获取模板列表成功，共${total}条记录`);
      return { templates, total };
    } catch (error: any) {
      logger.error(`获取模板列表失败: ${error.message}`);
      throw new AppError(`获取模板列表失败: ${error.message}`, 500);
    }
  }

  /**
   * 获取单个模板
   */
  static async getTemplateById(id: string): Promise<ITemplate> {
    try {
      logger.info(`获取模板: ${id}`);
      
      const template = await Template.findById(id).populate('createdBy', 'username');
      if (!template) {
        throw new AppError('模板不存在', 404);
      }
      
      logger.info(`获取模板成功: ${id}`);
      return template;
    } catch (error: any) {
      logger.error(`获取模板失败: ${error.message}`);
      throw new AppError(`获取模板失败: ${error.message}`, 500);
    }
  }

  /**
   * 更新模板
   */
  static async updateTemplate(id: string, dto: UpdateTemplateDto): Promise<ITemplate> {
    try {
      logger.info(`更新模板: ${id}`);
      
      // 检查模板是否存在
      const template = await Template.findById(id);
      if (!template) {
        throw new AppError('模板不存在', 404);
      }
      
      // 更新模板
      Object.assign(template, dto);
      await template.save();
      
      logger.info(`模板更新成功: ${id}`);
      return template;
    } catch (error: any) {
      logger.error(`模板更新失败: ${error.message}`);
      throw new AppError(`模板更新失败: ${error.message}`, 500);
    }
  }

  /**
   * 删除模板
   */
  static async deleteTemplate(id: string): Promise<void> {
    try {
      logger.info(`删除模板: ${id}`);
      
      const result = await Template.findByIdAndDelete(id);
      if (!result) {
        throw new AppError('模板不存在', 404);
      }
      
      logger.info(`模板删除成功: ${id}`);
    } catch (error: any) {
      logger.error(`模板删除失败: ${error.message}`);
      throw new AppError(`模板删除失败: ${error.message}`, 500);
    }
  }

  /**
   * 收藏模板
   */
  static async toggleFavorite(id: string): Promise<ITemplate> {
    try {
      logger.info(`切换模板收藏状态: ${id}`);
      
      const template = await Template.findById(id);
      if (!template) {
        throw new AppError('模板不存在', 404);
      }
      
      template.isFavorite = !template.isFavorite;
      await template.save();
      
      logger.info(`模板收藏状态切换成功: ${id}`);
      return template;
    } catch (error: any) {
      logger.error(`模板收藏状态切换失败: ${error.message}`);
      throw new AppError(`模板收藏状态切换失败: ${error.message}`, 500);
    }
  }

  /**
   * 获取预设模板
   */
  static async getPresetTemplates(): Promise<ITemplate[]> {
    try {
      logger.info('获取预设模板列表');
      
      const templates = await Template.find({ isPreset: true }).sort({ category: 1, name: 1 });
      
      logger.info(`获取预设模板成功，共${templates.length}条记录`);
      return templates;
    } catch (error: any) {
      logger.error(`获取预设模板失败: ${error.message}`);
      throw new AppError(`获取预设模板失败: ${error.message}`, 500);
    }
  }

  /**
   * 获取分类列表
   */
  static async getCategories(): Promise<string[]> {
    try {
      logger.info('获取模板分类列表');
      
      const categories = await Template.distinct('category');
      
      logger.info(`获取模板分类成功，共${categories.length}个分类`);
      return categories;
    } catch (error: any) {
      logger.error(`获取模板分类失败: ${error.message}`);
      throw new AppError(`获取模板分类失败: ${error.message}`, 500);
    }
  }
}