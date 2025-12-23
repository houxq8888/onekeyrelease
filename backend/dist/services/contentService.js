import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import OpenAI from 'openai';
import axios from 'axios';
export class ContentService {
    static openai = null;
    /**
     * 初始化OpenAI客户端
     */
    static initOpenAI() {
        if (!this.openai) {
            const apiKey = process.env.OPENAI_API_KEY;
            if (!apiKey) {
                throw new AppError('OpenAI API密钥未配置', 500);
            }
            this.openai = new OpenAI({ apiKey });
        }
        return this.openai;
    }
    /**
     * 生成文案内容
     */
    static async generateContent(config) {
        try {
            logger.info(`开始生成内容: ${config.theme}`);
            // 检查是否配置了AI API
            if (process.env.OPENAI_API_KEY) {
                // 使用AI生成真实内容
                return await this.generateContentWithAI(config);
            }
            else {
                // 使用模拟数据
                logger.warn('未配置AI API密钥，使用模拟数据生成内容');
                return this.mockContentGeneration(config);
            }
        }
        catch (error) {
            logger.error(`内容生成失败: ${error.message}`);
            throw new AppError(`内容生成失败: ${error.message}`, 500);
        }
    }
    /**
     * 使用AI生成内容
     */
    static async generateContentWithAI(config) {
        try {
            const openai = this.initOpenAI();
            const prompt = this.buildContentPrompt(config);
            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的内容创作者，擅长为小红书平台创作吸引人的内容。请根据用户提供的信息生成符合小红书风格的内容。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7,
            });
            const aiContent = completion.choices[0]?.message?.content;
            if (!aiContent) {
                throw new AppError('AI生成内容为空', 500);
            }
            // 解析AI生成的内容
            return this.parseAIContent(aiContent, config);
        }
        catch (error) {
            logger.error(`AI内容生成失败: ${error.message}`);
            // 如果AI生成失败，回退到模拟生成
            return this.mockContentGeneration(config);
        }
    }
    /**
     * 构建内容生成提示词
     */
    static buildContentPrompt(config) {
        const styles = {
            formal: '正式专业，语言严谨，适合官方发布',
            casual: '轻松随意，亲切自然，适合日常分享',
            professional: '权威可信，专业性强，适合知识分享',
            creative: '新颖有趣，创意十足，适合吸引眼球'
        };
        return `
请为小红书平台生成一篇内容，要求如下：

主题：${config.theme}
关键词：${config.keywords.join('、')}
目标受众：${config.targetAudience}
风格：${styles[config.style]}
字数：约${config.wordCount}字

请按照以下格式返回内容：
标题：[生成的标题]
内容：[生成的内容正文]
标签：[5-10个相关标签，用逗号分隔]
摘要：[50字左右的摘要]

内容要求：
1. 符合小红书平台风格，亲切自然
2. 包含emoji表情符号增加趣味性
3. 段落清晰，易于阅读
4. 包含与目标受众相关的具体建议或经验分享
    `;
    }
    /**
     * 解析AI生成的内容
     */
    static parseAIContent(aiContent, config) {
        try {
            // 简单的解析逻辑，实际应用中可能需要更复杂的解析
            const lines = aiContent.split('\n').filter(line => line.trim());
            let title = '';
            let content = '';
            let hashtags = [];
            let summary = '';
            let currentSection = '';
            for (const line of lines) {
                if (line.startsWith('标题：')) {
                    title = line.replace('标题：', '').trim();
                    currentSection = 'title';
                }
                else if (line.startsWith('内容：')) {
                    content = line.replace('内容：', '').trim();
                    currentSection = 'content';
                }
                else if (line.startsWith('标签：')) {
                    const tags = line.replace('标签：', '').trim();
                    hashtags = tags.split(/[,，]/).map(tag => tag.trim()).filter(tag => tag);
                    currentSection = 'tags';
                }
                else if (line.startsWith('摘要：')) {
                    summary = line.replace('摘要：', '').trim();
                    currentSection = 'summary';
                }
                else {
                    // 继续当前部分的内容
                    if (currentSection === 'content' && content) {
                        content += '\n' + line;
                    }
                }
            }
            // 如果解析失败，使用默认值
            if (!title)
                title = `${config.theme} - ${config.targetAudience}必看`;
            if (!content)
                content = this.mockContentGeneration(config).content;
            if (!hashtags.length)
                hashtags = config.keywords.map(kw => `#${kw}`);
            if (!summary)
                summary = `关于${config.theme}的精彩内容分享`;
            return {
                title,
                content,
                hashtags,
                summary,
            };
        }
        catch (error) {
            logger.error('解析AI内容失败，使用模拟数据');
            return this.mockContentGeneration(config);
        }
    }
    /**
     * 生成图片
     */
    static async generateImages(theme, count = 1) {
        try {
            logger.info(`开始生成图片: ${theme}`);
            // 检查是否配置了图像生成API
            if (process.env.STABLE_DIFFUSION_API_URL) {
                // 使用AI生成真实图片
                return await this.generateImagesWithAI(theme, count);
            }
            else {
                // 使用模拟图片
                logger.warn('未配置图像生成API，使用模拟图片');
                return this.mockImageGeneration(theme, count);
            }
        }
        catch (error) {
            logger.error(`图片生成失败: ${error.message}`);
            throw new AppError(`图片生成失败: ${error.message}`, 500);
        }
    }
    /**
     * 使用AI生成图片
     */
    static async generateImagesWithAI(theme, count) {
        try {
            const apiUrl = process.env.STABLE_DIFFUSION_API_URL;
            if (!apiUrl) {
                throw new AppError('图像生成API地址未配置', 500);
            }
            const images = [];
            for (let i = 0; i < count; i++) {
                const prompt = this.buildImagePrompt(theme, i);
                const response = await axios.post(apiUrl, {
                    prompt,
                    negative_prompt: 'blurry, low quality, watermark, text',
                    steps: 20,
                    width: 1024,
                    height: 1024,
                    cfg_scale: 7.5,
                }, {
                    timeout: 30000,
                });
                if (response.data && response.data.images && response.data.images.length > 0) {
                    // 假设API返回base64编码的图片
                    const imageData = response.data.images[0];
                    // 这里应该将图片保存到文件系统或云存储
                    const imageUrl = await this.saveGeneratedImage(imageData, `image-${Date.now()}-${i}`);
                    images.push(imageUrl);
                }
                else {
                    throw new AppError('图像生成API返回数据格式错误', 500);
                }
            }
            logger.info(`AI图片生成成功: ${theme} - ${count}张`);
            return images;
        }
        catch (error) {
            logger.error(`AI图片生成失败: ${error.message}`);
            // 如果AI生成失败，回退到模拟生成
            return this.mockImageGeneration(theme, count);
        }
    }
    /**
     * 构建图片生成提示词
     */
    static buildImagePrompt(theme, index) {
        const styles = [
            '小红书风格，清新自然，高饱和度',
            'ins风，简约时尚，高级感',
            '日系风格，温暖治愈，生活化',
            '欧美风格，大气简约，质感强'
        ];
        const style = styles[index % styles.length];
        return `${theme}，${style}，高清，细节丰富，适合社交媒体分享`;
    }
    /**
     * 保存生成的图片
     */
    static async saveGeneratedImage(_imageData, filename) {
        // 这里应该实现图片保存逻辑
        // 暂时返回模拟URL
        return `https://storage.example.com/generated/${filename}.jpg`;
    }
    /**
     * 模拟图片生成
     */
    static mockImageGeneration(_theme, count) {
        // 使用真实的占位图片服务，确保图片可以显示
        return Array.from({ length: count }, (_, i) => `https://picsum.photos/1024/1024?random=${Date.now()}-${i}`);
    }
    /**
     * 生成视频
     */
    static async generateVideo(theme) {
        try {
            logger.info(`开始生成视频: ${theme}`);
            // 检查是否配置了视频生成API
            if (process.env.VIDEO_GENERATION_API_URL) {
                // 使用AI生成真实视频
                return await this.generateVideoWithAI(theme);
            }
            else {
                // 使用模拟视频
                logger.warn('未配置视频生成API，使用模拟视频');
                return this.mockVideoGeneration(theme);
            }
        }
        catch (error) {
            logger.error(`视频生成失败: ${error.message}`);
            throw new AppError(`视频生成失败: ${error.message}`, 500);
        }
    }
    /**
     * 使用AI生成视频
     */
    static async generateVideoWithAI(theme) {
        try {
            const apiUrl = process.env.VIDEO_GENERATION_API_URL;
            if (!apiUrl) {
                throw new AppError('视频生成API地址未配置', 500);
            }
            const prompt = this.buildVideoPrompt(theme);
            const response = await axios.post(apiUrl, {
                prompt,
                duration: 15, // 15秒视频
                resolution: '720p',
                style: '小红书风格',
            }, {
                timeout: 60000, // 视频生成需要更长时间
            });
            if (response.data && response.data.video_url) {
                const videoUrl = response.data.video_url;
                logger.info(`AI视频生成成功: ${theme}`);
                return videoUrl;
            }
            else {
                throw new AppError('视频生成API返回数据格式错误', 500);
            }
        }
        catch (error) {
            logger.error(`AI视频生成失败: ${error.message}`);
            // 如果AI生成失败，回退到模拟生成
            return this.mockVideoGeneration(theme);
        }
    }
    /**
     * 构建视频生成提示词
     */
    static buildVideoPrompt(theme) {
        return `${theme}，小红书风格短视频，15秒，高清，适合社交媒体分享，包含动态文字和背景音乐`;
    }
    /**
     * 模拟视频生成
     */
    static mockVideoGeneration(theme) {
        return `https://example.com/generated/${theme}-video-${Date.now()}.mp4`;
    }
    /**
     * 内容优化
     */
    static async optimizeContent(content, targetPlatform) {
        try {
            logger.info(`开始优化内容: ${targetPlatform}`);
            // 检查是否配置了OpenAI API
            if (process.env.OPENAI_API_KEY) {
                // 使用AI进行内容优化
                return await this.optimizeContentWithAI(content, targetPlatform);
            }
            else {
                // 使用模拟优化
                logger.warn('未配置OpenAI API，使用模拟优化');
                return this.mockContentOptimization(content, targetPlatform);
            }
        }
        catch (error) {
            logger.error(`内容优化失败: ${error.message}`);
            throw new AppError(`内容优化失败: ${error.message}`, 500);
        }
    }
    /**
     * 使用AI优化内容
     */
    static async optimizeContentWithAI(content, targetPlatform) {
        try {
            const openai = this.initOpenAI();
            const prompt = this.buildOptimizationPrompt(content, targetPlatform);
            const response = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的内容优化助手，专门为小红书平台优化内容。请将内容优化得更吸引人、更符合小红书风格。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7,
            });
            if (response.choices && response.choices[0] && response.choices[0].message) {
                const optimizedContent = response.choices[0].message.content;
                logger.info('AI内容优化成功');
                return optimizedContent || content;
            }
            else {
                throw new AppError('AI优化返回数据格式错误', 500);
            }
        }
        catch (error) {
            logger.error(`AI内容优化失败: ${error.message}`);
            // 如果AI优化失败，回退到模拟优化
            return this.mockContentOptimization(content, targetPlatform);
        }
    }
    /**
     * 构建内容优化提示词
     */
    static buildOptimizationPrompt(content, targetPlatform) {
        return `请优化以下内容，使其更符合${targetPlatform}平台风格：\n\n${content}\n\n要求：\n1. 语言生动有趣，吸引眼球\n2. 添加适当的emoji表情\n3. 优化段落结构，便于阅读\n4. 添加相关话题标签\n5. 保持原意不变`;
    }
    /**
     * 模拟内容优化
     */
    static mockContentOptimization(content, targetPlatform) {
        let optimizedContent = content;
        if (targetPlatform === 'xiaohongshu') {
            // 小红书风格优化
            optimizedContent = this.optimizeForXiaohongshu(content);
        }
        return `✨ 优化后的内容 ✨\n\n${optimizedContent}\n\n#${targetPlatform} #内容优化 #优质内容`;
    }
    /**
     * 批量生成内容
     */
    static async batchGenerateContent(themes) {
        try {
            logger.info(`开始批量生成内容，主题数量: ${themes.length}`);
            // 并行处理所有主题
            const promises = themes.map(async (theme) => {
                try {
                    logger.info(`处理主题: ${theme}`);
                    // 生成文案内容
                    const content = await this.generateContent({
                        theme,
                        keywords: [theme],
                        targetAudience: '小红书用户',
                        style: 'casual',
                        wordCount: 300
                    });
                    // 生成图片
                    const images = await this.generateImages(theme);
                    // 生成视频（简化实现）
                    const video = await this.generateVideo(theme);
                    const result = {
                        theme,
                        content,
                        images,
                        video,
                        status: 'success'
                    };
                    logger.info(`主题生成成功: ${theme}`);
                    return result;
                }
                catch (error) {
                    logger.error(`主题生成失败: ${theme}, 错误: ${error.message}`);
                    const result = {
                        theme,
                        content: {
                            title: '',
                            content: '',
                            hashtags: [],
                            summary: ''
                        },
                        images: [],
                        video: '',
                        status: 'error',
                        error: error.message
                    };
                    return result;
                }
            });
            // 等待所有任务完成
            const batchResults = await Promise.all(promises);
            const successCount = batchResults.filter(r => r.status === 'success').length;
            const errorCount = batchResults.filter(r => r.status === 'error').length;
            logger.info(`批量内容生成完成，成功: ${successCount}, 失败: ${errorCount}`);
            return batchResults;
        }
        catch (error) {
            logger.error(`批量内容生成失败: ${error.message}`);
            throw new AppError(`批量内容生成失败: ${error.message}`, 500);
        }
    }
    /**
     * 发布内容
     */
    static async publishContent(content, images, video, platform) {
        try {
            logger.info(`开始发布内容到平台: ${platform}`);
            // 根据平台选择发布策略
            switch (platform) {
                case 'xiaohongshu':
                    return await this.publishToXiaohongshu(content, images, video);
                case 'douyin':
                    return await this.publishToDouyin(content, images, video);
                case 'weibo':
                    return await this.publishToWeibo(content, images, video);
                default:
                    throw new AppError(`不支持的发布平台: ${platform}`, 400);
            }
        }
        catch (error) {
            logger.error(`内容发布失败: ${error.message}`);
            throw new AppError(`内容发布失败: ${error.message}`, 500);
        }
    }
    /**
     * 发布到小红书
     */
    static async publishToXiaohongshu(content, images, video) {
        try {
            // 检查是否配置了小红书API
            if (process.env.XIAOHONGSHU_API_URL && process.env.XIAOHONGSHU_ACCESS_TOKEN) {
                return await this.publishToXiaohongshuAPI(content, images, video);
            }
            else {
                // 使用模拟发布
                logger.warn('未配置小红书API，使用模拟发布');
                return this.mockPublishToXiaohongshu(content, images, video);
            }
        }
        catch (error) {
            logger.error(`小红书发布失败: ${error.message}`);
            throw error;
        }
    }
    /**
     * 使用小红书API发布
     */
    static async publishToXiaohongshuAPI(content, images, video) {
        const apiUrl = process.env.XIAOHONGSHU_API_URL;
        const accessToken = process.env.XIAOHONGSHU_ACCESS_TOKEN;
        if (!apiUrl || !accessToken) {
            throw new AppError('小红书API配置不完整', 500);
        }
        const publishData = {
            content,
            images,
            video,
            publish_time: new Date().toISOString(),
            tags: ['#小红书', '#内容发布', '#优质内容']
        };
        const response = await axios.post(`${apiUrl}/publish`, publishData, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 30000,
        });
        if (response.data && response.data.publish_id) {
            logger.info(`小红书发布成功: ${response.data.publish_id}`);
            return response.data.publish_id;
        }
        else {
            throw new AppError('小红书API返回数据格式错误', 500);
        }
    }
    /**
     * 模拟发布到小红书
     */
    static mockPublishToXiaohongshu(_content, _images, _video) {
        const publishId = `xiaohongshu-pub-${Date.now()}`;
        logger.info(`模拟小红书发布成功: ${publishId}`);
        return publishId;
    }
    /**
     * 发布到抖音
     */
    static async publishToDouyin(_content, _images, _video) {
        // 抖音发布逻辑类似，这里简化处理
        const publishId = `douyin-pub-${Date.now()}`;
        logger.info(`模拟抖音发布成功: ${publishId}`);
        return publishId;
    }
    /**
     * 发布到微博
     */
    static async publishToWeibo(_content, _images, _video) {
        // 微博发布逻辑类似，这里简化处理
        const publishId = `weibo-pub-${Date.now()}`;
        logger.info(`模拟微博发布成功: ${publishId}`);
        return publishId;
    }
    /**
     * 模拟内容生成（临时实现）
     */
    static mockContentGeneration(config) {
        const styles = {
            formal: '正式、专业、严谨',
            casual: '轻松、随意、亲切',
            professional: '专业、权威、可信',
            creative: '创意、新颖、有趣',
        };
        const hashtags = [
            ...config.keywords,
            config.theme,
            config.targetAudience,
            styles[config.style],
        ].map(tag => `#${tag}`);
        const content = `
      <h3>${config.theme} - ${config.targetAudience}专属内容</h3>
      
      <p>亲爱的${config.targetAudience}朋友们，今天我们来聊聊${config.theme}这个话题。</p>
      
      <p>${config.keywords.join('、')}这些关键词都是我们关注的焦点。通过${styles[config.style]}的表达方式，我们希望为您带来有价值的内容。</p>
      
      <p>无论您是${config.targetAudience}中的一员，还是对这个话题感兴趣的朋友，相信这篇文章都能给您带来启发。</p>
      
      <p>记得关注我们，获取更多精彩内容！</p>
    `.trim();
        return {
            title: `${config.theme} - ${config.targetAudience}必看`,
            content,
            hashtags: [...new Set(hashtags)].slice(0, 10), // 去重并限制数量
            summary: `本文围绕${config.theme}展开，针对${config.targetAudience}群体，采用${styles[config.style]}的风格，探讨了${config.keywords.join('、')}等关键话题。`,
        };
    }
    /**
     * 小红书内容优化
     */
    static optimizeForXiaohongshu(content) {
        // 小红书风格优化：更口语化、更亲切
        return content
            .replace(/亲爱的/g, '宝子们')
            .replace(/朋友们/g, '姐妹们')
            .replace(/我们/g, '俺们')
            .replace(/您/g, '你')
            .replace(/相信/g, '真心觉得')
            .replace(/有价值的内容/g, '超实用的干货')
            .replace(/关注我们/g, '关注我鸭');
    }
}
