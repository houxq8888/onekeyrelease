import express from 'express';
import mongoose from 'mongoose';
import { ContentService } from '../../services/contentService';
import { authMiddleware } from '../../middleware/auth';
import { Content } from '../../models/Content';
const router = express.Router();
// 生成文案内容
router.post('/generate', authMiddleware, async (req, res, _next) => {
    try {
        const config = req.body;
        // 处理前端字段映射：topic -> theme
        const theme = config.topic || config.theme;
        // 处理内容长度映射
        const lengthMapping = {
            'short': 200,
            'medium': 500,
            'long': 800
        };
        const wordCount = config.wordCount || lengthMapping[config.length] || 500;
        // 验证配置
        if (!theme || !config.keywords || !config.targetAudience) {
            return res.status(400).json({
                success: false,
                error: '请提供完整的生成配置（主题、关键词、目标受众）',
            });
        }
        // 构建后端期望的配置格式
        const backendConfig = {
            theme: theme,
            keywords: Array.isArray(config.keywords) ? config.keywords : [],
            targetAudience: config.targetAudience,
            style: config.style || 'casual',
            wordCount: wordCount
        };
        const content = await ContentService.generateContent(backendConfig);
        // 保存到历史记录
        const userId = req.user._id;
        // 检查是否使用内存数据库模式（演示用户）
        const isDemoUser = userId === 'demo-user-id';
        if (isDemoUser) {
            // 演示用户模式：保存到内存存储
            const { memoryStorage } = await import('../../config/database.js');
            const contentId = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const contentRecord = {
                _id: contentId,
                ...content,
                theme: backendConfig.theme,
                keywords: backendConfig.keywords,
                targetAudience: backendConfig.targetAudience,
                style: backendConfig.style,
                wordCount: backendConfig.wordCount,
                platform: 'xiaohongshu',
                status: 'generated',
                createdBy: userId,
                images: [], // 初始化图片数组
                generatedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            memoryStorage.addContent(contentRecord);
        }
        else {
            // 正常MongoDB模式
            await Content.create({
                ...content,
                theme: backendConfig.theme,
                keywords: backendConfig.keywords,
                targetAudience: backendConfig.targetAudience,
                style: backendConfig.style,
                wordCount: backendConfig.wordCount,
                platform: 'xiaohongshu',
                status: 'generated',
                createdBy: userId,
                images: [], // 初始化图片数组
            });
        }
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
// 手动录入内容
router.post('/manual', authMiddleware, async (req, res, _next) => {
    try {
        const { title, content, keywords, summary, theme, targetAudience, style, wordCount } = req.body;
        const userId = req.user._id;
        // 验证必填字段
        if (!title || !content || !theme) {
            return res.status(400).json({
                success: false,
                error: '请提供标题、正文和主题',
            });
        }
        // 检查是否使用内存数据库模式（演示用户）
        const isDemoUser = userId === 'demo-user-id';
        let savedContent;
        if (isDemoUser) {
            // 演示用户模式：保存到内存存储
            const { memoryStorage } = await import('../../config/database.js');
            const contentId = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const contentRecord = {
                _id: contentId,
                title,
                content,
                hashtags: keywords ? (Array.isArray(keywords) ? keywords : [keywords]) : [],
                summary: summary || '',
                theme,
                keywords: keywords ? (Array.isArray(keywords) ? keywords : [keywords]) : [],
                targetAudience: targetAudience || 'general',
                style: style || 'casual',
                wordCount: wordCount || content.length,
                images: [],
                video: '',
                platform: 'xiaohongshu',
                status: 'generated',
                createdBy: userId,
                generatedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            };
            memoryStorage.addContent(contentRecord);
            savedContent = contentRecord;
        }
        else {
            // 正常MongoDB模式
            savedContent = await Content.create({
                title,
                content,
                hashtags: keywords ? (Array.isArray(keywords) ? keywords : [keywords]) : [],
                summary: summary || '',
                theme,
                keywords: keywords ? (Array.isArray(keywords) ? keywords : [keywords]) : [],
                targetAudience: targetAudience || 'general',
                style: style || 'casual',
                wordCount: wordCount || content.length,
                images: [],
                video: '',
                platform: 'xiaohongshu',
                status: 'generated',
                createdBy: userId,
            });
        }
        return res.status(201).json({
            success: true,
            data: savedContent,
            message: '内容录入成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 批量内容生成
router.post('/batch/generate', authMiddleware, async (req, res, _next) => {
    try {
        const { configs } = req.body;
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
        const results = await ContentService.batchGenerateContent(configs.map(config => config.theme));
        return res.json({
            success: true,
            data: results,
            message: `批量内容生成完成，成功 ${results.filter(r => r.status === 'success').length}/${configs.length} 个`,
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
// 获取历史内容列表
router.get('/', authMiddleware, async (req, res, _next) => {
    try {
        const { page = 1, limit = 10, theme, status } = req.query;
        const userId = req.user._id;
        // 构建查询条件 - 处理演示用户的字符串ID
        const query = { createdBy: userId };
        if (theme) {
            query.theme = { $regex: theme, $options: 'i' };
        }
        if (status) {
            query.status = status;
        }
        // 分页查询
        const skip = (parseInt(page) - 1) * parseInt(limit);
        // 检查是否使用内存数据库模式（演示用户）
        const isDemoUser = userId === 'demo-user-id';
        let contents = [];
        let total = 0;
        if (isDemoUser) {
            // 演示用户模式：从内存存储获取内容
            const { memoryStorage } = await import('../../config/database.js');
            const allContents = memoryStorage.getContents();
            // 过滤和分页
            let filteredContents = allContents.filter((content) => {
                if (theme && !content.theme?.toLowerCase().includes(theme.toString().toLowerCase())) {
                    return false;
                }
                if (status && content.status !== status) {
                    return false;
                }
                return content.createdBy === userId;
            });
            total = filteredContents.length;
            contents = filteredContents
                .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())
                .slice(skip, skip + parseInt(limit))
                .map((content) => ({
                ...content,
                // 不返回完整内容，提高性能
                content: undefined
            }));
        }
        else {
            // 正常MongoDB模式 - 使用ObjectId
            const query = { createdBy: new mongoose.Types.ObjectId(userId) };
            if (theme) {
                query.theme = { $regex: theme, $options: 'i' };
            }
            if (status) {
                query.status = status;
            }
            contents = await Content.find(query)
                .sort({ generatedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .select('-content'); // 不返回完整内容，提高性能
            total = await Content.countDocuments(query);
        }
        return res.json({
            success: true,
            data: {
                contents,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 获取单个内容详情
router.get('/:id', authMiddleware, async (req, res, _next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        // 检查是否使用内存数据库模式（演示用户）
        const isDemoUser = userId === 'demo-user-id';
        let content;
        if (isDemoUser) {
            // 演示用户模式：从内存存储获取内容
            const { memoryStorage } = await import('../../config/database.js');
            const allContents = memoryStorage.getContents();
            content = allContents.find((c) => c._id === id && c.createdBy === userId);
        }
        else {
            // 正常MongoDB模式 - 使用ObjectId
            content = await Content.findOne({
                _id: id,
                createdBy: new mongoose.Types.ObjectId(userId)
            });
        }
        if (!content) {
            return res.status(404).json({
                success: false,
                error: '内容不存在',
            });
        }
        return res.json({
            success: true,
            data: content,
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 删除内容
router.delete('/:id', authMiddleware, async (req, res, _next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        // 检查是否使用内存数据库模式（演示用户）
        const isDemoUser = userId === 'demo-user-id';
        if (isDemoUser) {
            // 演示用户模式：从内存存储删除内容
            const { memoryStorage } = await import('../../config/database.js');
            const content = memoryStorage.findContentById(id);
            if (!content) {
                return res.status(404).json({
                    success: false,
                    error: '内容不存在',
                });
            }
            memoryStorage.deleteContent(id);
        }
        else {
            // 正常MongoDB模式 - 使用ObjectId
            const content = await Content.findOneAndDelete({
                _id: id,
                createdBy: new mongoose.Types.ObjectId(userId)
            });
            if (!content) {
                return res.status(404).json({
                    success: false,
                    error: '内容不存在',
                });
            }
        }
        return res.json({
            success: true,
            message: '内容删除成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 更新内容
router.put('/:id', authMiddleware, async (req, res, _next) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;
        const updateData = req.body;
        // 验证更新数据
        if (!updateData || Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                error: '请提供要更新的内容',
            });
        }
        // 检查是否使用内存数据库模式（演示用户）
        const isDemoUser = userId === 'demo-user-id';
        let updatedContent;
        if (isDemoUser) {
            // 演示用户模式：更新内存存储中的内容
            const { memoryStorage } = await import('../../config/database.js');
            const content = memoryStorage.findContentById(id);
            if (!content || content.createdBy !== userId) {
                return res.status(404).json({
                    success: false,
                    error: '内容不存在',
                });
            }
            // 更新内容
            const updatedData = {
                ...updateData,
                updatedAt: new Date()
            };
            updatedContent = memoryStorage.updateContent(id, updatedData);
        }
        else {
            // 正常MongoDB模式 - 使用ObjectId
            const content = await Content.findOne({
                _id: id,
                createdBy: new mongoose.Types.ObjectId(userId)
            });
            if (!content) {
                return res.status(404).json({
                    success: false,
                    error: '内容不存在',
                });
            }
            // 更新内容
            updatedContent = await Content.findOneAndUpdate({
                _id: id,
                createdBy: new mongoose.Types.ObjectId(userId)
            }, {
                ...updateData,
                updatedAt: new Date()
            }, { new: true });
        }
        return res.json({
            success: true,
            data: updatedContent,
            message: '内容更新成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 一键发布内容
router.post('/publish', authMiddleware, async (req, res, _next) => {
    try {
        const { content, images, platform = 'xiaohongshu' } = req.body;
        if (!content || !images || images.length === 0) {
            return res.status(400).json({
                success: false,
                error: '请提供内容和至少一张图片',
            });
        }
        const publishResult = await ContentService.publishContent(content, images, '', // video参数，暂时为空
        platform);
        return res.json({
            success: true,
            data: publishResult,
            message: '内容发布成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 保存图片到内容记录
router.post('/:id/images', authMiddleware, async (req, res, _next) => {
    try {
        const { id } = req.params;
        const { images } = req.body;
        const userId = req.user._id;
        if (!images || !Array.isArray(images) || images.length === 0) {
            return res.status(400).json({
                success: false,
                error: '请提供要保存的图片URL数组',
            });
        }
        // 检查是否使用内存数据库模式（演示用户）
        const isDemoUser = userId === 'demo-user-id';
        let updatedContent;
        if (isDemoUser) {
            // 演示用户模式：更新内存存储中的内容
            const { memoryStorage } = await import('../../config/database.js');
            const content = memoryStorage.findContentById(id);
            if (!content || content.createdBy !== userId) {
                return res.status(404).json({
                    success: false,
                    error: '内容不存在',
                });
            }
            // 更新图片数组
            updatedContent = memoryStorage.updateContent(id, {
                images: images,
                updatedAt: new Date()
            });
        }
        else {
            // 正常MongoDB模式 - 使用ObjectId
            const content = await Content.findOne({
                _id: id,
                createdBy: new mongoose.Types.ObjectId(userId)
            });
            if (!content) {
                return res.status(404).json({
                    success: false,
                    error: '内容不存在',
                });
            }
            // 更新图片数组
            updatedContent = await Content.findOneAndUpdate({
                _id: id,
                createdBy: new mongoose.Types.ObjectId(userId)
            }, {
                images: images,
                updatedAt: new Date()
            }, { new: true });
        }
        return res.json({
            success: true,
            data: updatedContent,
            message: '图片保存成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
export default router;
