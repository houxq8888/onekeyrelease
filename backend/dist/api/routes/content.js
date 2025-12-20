import express from 'express';
import { ContentService } from '../../services/contentService';
import { authMiddleware } from '../../middleware/auth';
const router = express.Router();
// 生成文案内容
router.post('/generate', authMiddleware, async (req, res, _next) => {
    try {
        const config = req.body;
        // 验证配置
        if (!config.theme || !config.keywords || !config.targetAudience) {
            return res.status(400).json({
                success: false,
                error: '请提供完整的生成配置（主题、关键词、目标受众）',
            });
        }
        const content = await ContentService.generateContent(config);
        return res.json({
            success: true,
            data: content,
            message: '内容生成成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 生成图片
router.post('/generate/images', authMiddleware, async (req, res, _next) => {
    try {
        const { theme, count = 1 } = req.body;
        if (!theme) {
            return res.status(400).json({
                success: false,
                error: '请提供主题',
            });
        }
        const images = await ContentService.generateImages(theme, count);
        return res.json({
            success: true,
            data: images,
            message: '图片生成成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 生成视频
router.post('/generate/video', authMiddleware, async (req, res, _next) => {
    try {
        const { theme } = req.body;
        if (!theme) {
            return res.status(400).json({
                success: false,
                error: '请提供主题',
            });
        }
        const video = await ContentService.generateVideo(theme);
        return res.json({
            success: true,
            data: video,
            message: '视频生成成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 内容优化
router.post('/optimize', authMiddleware, async (req, res, _next) => {
    try {
        const { content, targetPlatform } = req.body;
        if (!content || !targetPlatform) {
            return res.status(400).json({
                success: false,
                error: '请提供内容和目标平台',
            });
        }
        const optimizedContent = await ContentService.optimizeContent(content, targetPlatform);
        return res.json({
            success: true,
            data: optimizedContent,
            message: '内容优化成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 批量内容生成
router.post('/batch/generate', authMiddleware, async (req, res, _next) => {
    try {
        const { configs, includeImages = false, includeVideo = false } = req.body;
        if (!configs || !Array.isArray(configs) || configs.length === 0) {
            return res.status(400).json({
                success: false,
                error: '请提供有效的配置列表',
            });
        }
        // 验证每个配置
        for (const config of configs) {
            if (!config.theme || !config.keywords || !config.targetAudience) {
                return res.status(400).json({
                    success: false,
                    error: '每个配置都需要包含主题、关键词和目标受众',
                });
            }
        }
        const results = await ContentService.batchGenerateContent(configs, includeImages, includeVideo);
        return res.json({
            success: true,
            data: results,
            message: `批量内容生成完成，成功 ${results.filter(r => r.success).length}/${configs.length} 个`,
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 获取支持的平台列表
router.get('/platforms', authMiddleware, async (_req, res, _next) => {
    try {
        const platforms = [
            {
                id: 'xiaohongshu',
                name: '小红书',
                description: '生活方式分享平台',
                features: ['图文笔记', '短视频', '直播'],
                contentRequirements: {
                    maxTitleLength: 20,
                    maxContentLength: 1000,
                    imageCount: 1,
                    hashtagCount: 10,
                },
            },
            // 可以添加更多平台
        ];
        return res.json({
            success: true,
            data: platforms,
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 获取内容风格选项
router.get('/styles', authMiddleware, async (_req, res, _next) => {
    try {
        const styles = [
            {
                id: 'formal',
                name: '正式',
                description: '专业严谨，适合官方发布',
                example: '尊敬的各位用户，我们很高兴地宣布...',
            },
            {
                id: 'casual',
                name: '轻松',
                description: '亲切随意，适合日常分享',
                example: '宝子们，今天发现了一个超好用的东西...',
            },
            {
                id: 'professional',
                name: '专业',
                description: '权威可信，适合专业知识分享',
                example: '根据最新的研究数据表明...',
            },
            {
                id: 'creative',
                name: '创意',
                description: '新颖有趣，适合创意内容',
                example: '哇！这个创意简直绝了，一定要试试...',
            },
        ];
        return res.json({
            success: true,
            data: styles,
        });
    }
    catch (error) {
        return _next(error);
    }
});
export default router;
