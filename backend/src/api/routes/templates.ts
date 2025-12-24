import express from 'express';
import { authMiddleware } from '../../middleware/auth';
import { TemplateService } from '../../services/templateService';
import { logger } from '../../utils/logger';

const router = express.Router();

// 创建模板
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    const templateData = req.body;

    const template = await TemplateService.createTemplate(userId, templateData);
    logger.info(`用户 ${userId} 创建模板: ${template.name}`);

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
});

// 获取模板列表
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    const { category, search, isFavorite } = req.query;

    const filters: any = {};
    if (category) filters.category = category;
    if (search) filters.search = search;
    if (isFavorite) filters.isFavorite = isFavorite === 'true';

    const templates = await TemplateService.getTemplates(userId, filters);

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    next(error);
  }
});

// 获取模板详情
router.get('/:templateId', authMiddleware, async (req, res, next) => {
  try {
    const { templateId } = req.params;

    const template = await TemplateService.getTemplateById(templateId);

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
});

// 更新模板
router.put('/:templateId', authMiddleware, async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    const { templateId } = req.params;
    const templateData = req.body;

    const template = await TemplateService.updateTemplate(userId, templateId, templateData);
    logger.info(`用户 ${userId} 更新模板: ${template.name}`);

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
});

// 删除模板
router.delete('/:templateId', authMiddleware, async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    const { templateId } = req.params;

    await TemplateService.deleteTemplate(userId, templateId);
    logger.info(`用户 ${userId} 删除模板: ${templateId}`);

    res.json({
      success: true,
      message: '模板删除成功'
    });
  } catch (error) {
    next(error);
  }
});

// 收藏模板
router.post('/:templateId/favorite', authMiddleware, async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    const { templateId } = req.params;

    await TemplateService.favoriteTemplate(userId, templateId);
    logger.info(`用户 ${userId} 收藏模板: ${templateId}`);

    res.json({
      success: true,
      message: '收藏成功'
    });
  } catch (error) {
    next(error);
  }
});

// 取消收藏模板
router.delete('/:templateId/favorite', authMiddleware, async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    const { templateId } = req.params;

    await TemplateService.unfavoriteTemplate(userId, templateId);
    logger.info(`用户 ${userId} 取消收藏模板: ${templateId}`);

    res.json({
      success: true,
      message: '取消收藏成功'
    });
  } catch (error) {
    next(error);
  }
});

// 获取用户收藏的模板
router.get('/favorites/list', authMiddleware, async (req, res, next) => {
  try {
    const { _id: userId } = req.user;

    const favorites = await TemplateService.getFavorites(userId);

    res.json({
      success: true,
      data: favorites
    });
  } catch (error) {
    next(error);
  }
});

// 检查模板是否已收藏
router.get('/:templateId/favorite', authMiddleware, async (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    const { templateId } = req.params;

    const isFavorite = await TemplateService.isTemplateFavorite(userId, templateId);

    res.json({
      success: true,
      data: { isFavorite }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
