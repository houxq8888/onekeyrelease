import express from 'express';
import { TemplateService } from '../../services/templateService';
import { authMiddleware, AuthRequest } from '../../middleware/auth';
import { logger } from '../../utils/logger';

const router = express.Router();

// 创建模板
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    logger.info('收到创建模板请求');
    
    const template = await TemplateService.createTemplate({
      ...req.body,
      createdBy: req.user._id,
    });
    
    res.status(201).json({
      success: true,
      data: template,
      message: '模板创建成功',
    });
  } catch (error: any) {
    logger.error(`创建模板失败: ${error.message}`);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

// 获取模板列表
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    logger.info('收到获取模板列表请求');
    
    const { page = 1, limit = 10, category, isFavorite, isPreset } = req.query;
    
    // 构建过滤条件
    const filter: any = {};
    if (category) filter.category = category;
    if (isFavorite !== undefined) filter.isFavorite = isFavorite === 'true';
    if (isPreset !== undefined) filter.isPreset = isPreset === 'true';
    
    const result = await TemplateService.getTemplates(filter, parseInt(page as string), parseInt(limit as string));
    
    res.json({
      success: true,
      data: result.templates,
      total: result.total,
      message: '模板列表获取成功',
    });
  } catch (error: any) {
    logger.error(`获取模板列表失败: ${error.message}`);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

// 获取单个模板
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    logger.info(`收到获取模板请求: ${req.params.id}`);
    
    const template = await TemplateService.getTemplateById(req.params.id);
    
    res.json({
      success: true,
      data: template,
      message: '模板获取成功',
    });
  } catch (error: any) {
    logger.error(`获取模板失败: ${error.message}`);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

// 更新模板
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    logger.info(`收到更新模板请求: ${req.params.id}`);
    
    const template = await TemplateService.updateTemplate(req.params.id, req.body);
    
    res.json({
      success: true,
      data: template,
      message: '模板更新成功',
    });
  } catch (error: any) {
    logger.error(`更新模板失败: ${error.message}`);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

// 删除模板
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    logger.info(`收到删除模板请求: ${req.params.id}`);
    
    await TemplateService.deleteTemplate(req.params.id);
    
    res.json({
      success: true,
      message: '模板删除成功',
    });
  } catch (error: any) {
    logger.error(`删除模板失败: ${error.message}`);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

// 切换模板收藏状态
router.patch('/:id/favorite', authMiddleware, async (req: AuthRequest, res) => {
  try {
    logger.info(`收到切换模板收藏状态请求: ${req.params.id}`);
    
    const template = await TemplateService.toggleFavorite(req.params.id);
    
    res.json({
      success: true,
      data: template,
      message: '模板收藏状态切换成功',
    });
  } catch (error: any) {
    logger.error(`切换模板收藏状态失败: ${error.message}`);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

// 获取预设模板
router.get('/preset/list', authMiddleware, async (_req: AuthRequest, res) => {
  try {
    logger.info('收到获取预设模板请求');
    
    const templates = await TemplateService.getPresetTemplates();
    
    res.json({
      success: true,
      data: templates,
      message: '预设模板列表获取成功',
    });
  } catch (error: any) {
    logger.error(`获取预设模板失败: ${error.message}`);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

// 获取分类列表
router.get('/categories/list', authMiddleware, async (_req: AuthRequest, res) => {
  try {
    logger.info('收到获取模板分类请求');
    
    const categories = await TemplateService.getCategories();
    
    res.json({
      success: true,
      data: categories,
      message: '模板分类列表获取成功',
    });
  } catch (error: any) {
    logger.error(`获取模板分类失败: ${error.message}`);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;