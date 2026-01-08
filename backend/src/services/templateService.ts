import { Template, TemplateFavorite, ITemplate } from '../models/Template';
import User from '../models/User';
import { ValidationError, NotFoundError } from '../utils/errors';

// 模板服务类
export class TemplateService {
  // 创建模板
  static async createTemplate(
    userId: string,
    templateData: {
      name: string;
      category: string;
      description: string;
      titleStructure: string[];
      contentFramework: string[];
      tagSuggestions: string[];
      imageCountSuggestion: number;
      isDefault?: boolean;
    }
  ): Promise<ITemplate> {
    // 检查用户是否存在
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }

    // 检查模板名称是否已存在
    const existingTemplate = await Template.findOne({ name: templateData.name });
    if (existingTemplate) {
      throw new ValidationError('模板名称已存在');
    }

    // 创建模板
    const template = new Template({
      ...templateData,
      createdBy: userId
    });

    return await template.save();
  }

  // 获取模板列表
  static async getTemplates(
    userId: string,
    filters?: {
      category?: string;
      search?: string;
      isFavorite?: boolean;
    }
  ): Promise<ITemplate[]> {
    const query: any = {};

    // 添加分类筛选
    if (filters?.category) {
      query.category = filters.category;
    }

    // 添加搜索筛选（名称或描述）
    if (filters?.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } }
      ];
    }

    // 获取模板
    let templates = await Template.find(query).sort({ createdAt: -1 });

    // 如果需要筛选收藏的模板
    if (filters?.isFavorite) {
      const favorites = await TemplateFavorite.find({ userId });
      const favoriteTemplateIds = favorites.map(fav => fav.templateId.toString());
      templates = templates.filter(template => favoriteTemplateIds.includes(template._id.toString()));
    }

    return templates;
  }

  // 获取模板详情
  static async getTemplateById(templateId: string): Promise<ITemplate> {
    const template = await Template.findById(templateId);
    if (!template) {
      throw new NotFoundError('模板不存在');
    }
    return template;
  }

  // 更新模板
  static async updateTemplate(
    userId: string,
    templateId: string,
    templateData: Partial<ITemplate>
  ): Promise<ITemplate> {
    const template = await Template.findById(templateId);
    if (!template) {
      throw new NotFoundError('模板不存在');
    }

    // 检查是否为模板创建者或管理员
    if (template.createdBy.toString() !== userId && !template.isDefault) {
      throw new ValidationError('没有权限修改此模板');
    }

    // 更新模板
    Object.assign(template, templateData);
    return await template.save();
  }

  // 删除模板
  static async deleteTemplate(userId: string, templateId: string): Promise<void> {
    const template = await Template.findById(templateId);
    if (!template) {
      throw new NotFoundError('模板不存在');
    }

    // 检查是否为模板创建者或管理员
    if (template.createdBy.toString() !== userId && !template.isDefault) {
      throw new ValidationError('没有权限删除此模板');
    }

    // 删除模板
    await Template.findByIdAndDelete(templateId);

    // 删除相关的收藏记录
    await TemplateFavorite.deleteMany({ templateId });
  }

  // 收藏模板
  static async favoriteTemplate(userId: string, templateId: string): Promise<void> {
    // 检查模板是否存在
    const template = await Template.findById(templateId);
    if (!template) {
      throw new NotFoundError('模板不存在');
    }

    // 检查是否已收藏
    const existingFavorite = await TemplateFavorite.findOne({ userId, templateId });
    if (existingFavorite) {
      throw new ValidationError('已收藏此模板');
    }

    // 创建收藏记录
    const favorite = new TemplateFavorite({ userId, templateId });
    await favorite.save();
  }

  // 取消收藏模板
  static async unfavoriteTemplate(userId: string, templateId: string): Promise<void> {
    // 检查模板是否存在
    const template = await Template.findById(templateId);
    if (!template) {
      throw new NotFoundError('模板不存在');
    }

    // 检查是否已收藏
    const existingFavorite = await TemplateFavorite.findOne({ userId, templateId });
    if (!existingFavorite) {
      throw new ValidationError('未收藏此模板');
    }

    // 删除收藏记录
    await TemplateFavorite.findByIdAndDelete(existingFavorite._id);
  }

  // 获取用户收藏的模板
  static async getFavorites(userId: string): Promise<ITemplate[]> {
    const favorites = await TemplateFavorite.find({ userId }).populate('templateId');
    return favorites.map(fav => fav.templateId as unknown as ITemplate);
  }

  // 检查模板是否已收藏
  static async isTemplateFavorite(userId: string, templateId: string): Promise<boolean> {
    const favorite = await TemplateFavorite.findOne({ userId, templateId });
    return !!favorite;
  }
}
