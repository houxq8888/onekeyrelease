import { Template } from '../models/Template';
import { logger } from '../utils/logger';
// 预设模板数据
const presetTemplates = [
    {
        name: '美食探店模板',
        category: '美食',
        description: '适合分享餐厅探店、美食推荐的模板',
        titleStructure: ['# 餐厅名称', '## 探店感受', '## 美食推荐', '## 实用信息'],
        contentFramework: [
            '### 餐厅环境',
            '### 菜品评价',
            '### 价格参考',
            '### 地址交通',
            '### 个人评分'
        ],
        tagSuggestions: ['美食', '探店', '餐厅', '推荐', '美食分享'],
        imageCountSuggestion: 4,
        isDefault: true
    },
    {
        name: '旅行攻略模板',
        category: '旅行',
        description: '适合分享旅行攻略、景点推荐的模板',
        titleStructure: ['# 目的地名称', '## 旅行攻略', '## 必去景点', '## 旅行贴士'],
        contentFramework: [
            '### 行程安排',
            '### 景点介绍',
            '### 美食推荐',
            '### 住宿建议',
            '### 交通指南',
            '### 旅行花费'
        ],
        tagSuggestions: ['旅行', '攻略', '景点', '推荐', '旅行分享'],
        imageCountSuggestion: 6,
        isDefault: true
    },
    {
        name: '美妆测评模板',
        category: '美妆',
        description: '适合分享美妆产品测评、化妆教程的模板',
        titleStructure: ['# 产品名称', '## 测评体验', '## 使用方法', '## 适用人群'],
        contentFramework: [
            '### 产品外观',
            '### 使用感受',
            '### 效果展示',
            '### 持久度',
            '### 价格参考',
            '### 购买链接'
        ],
        tagSuggestions: ['美妆', '测评', '化妆品', '教程', '美妆分享'],
        imageCountSuggestion: 5,
        isDefault: true
    },
    {
        name: '穿搭分享模板',
        category: '穿搭',
        description: '适合分享穿搭搭配、时尚单品推荐的模板',
        titleStructure: ['# 穿搭主题', '## 搭配灵感', '## 单品推荐', '## 穿搭技巧'],
        contentFramework: [
            '### 整体风格',
            '### 单品搭配',
            '### 材质细节',
            '### 颜色搭配',
            '### 场合适用性',
            '### 购买链接'
        ],
        tagSuggestions: ['穿搭', '时尚', '搭配', '单品', '时尚分享'],
        imageCountSuggestion: 4,
        isDefault: true
    },
    {
        name: '家居布置模板',
        category: '家居',
        description: '适合分享家居布置、装饰灵感的模板',
        titleStructure: ['# 空间名称', '## 布置灵感', '## 软装搭配', '## 收纳技巧'],
        contentFramework: [
            '### 整体风格',
            '### 色彩搭配',
            '### 家具选择',
            '### 装饰细节',
            '### 收纳方案',
            '### 购买链接'
        ],
        tagSuggestions: ['家居', '布置', '装饰', '收纳', '家居分享'],
        imageCountSuggestion: 5,
        isDefault: true
    },
    {
        name: '育儿经验模板',
        category: '育儿',
        description: '适合分享育儿经验、亲子活动的模板',
        titleStructure: ['# 育儿主题', '## 经验分享', '## 亲子活动', '## 育儿贴士'],
        contentFramework: [
            '### 问题描述',
            '### 解决方案',
            '### 实践效果',
            '### 注意事项',
            '### 资源推荐',
            '### 心得体会'
        ],
        tagSuggestions: ['育儿', '经验', '亲子', '活动', '育儿分享'],
        imageCountSuggestion: 3,
        isDefault: true
    }
];
// 初始化预设模板
export async function initPresetTemplates() {
    try {
        // 检查是否已存在预设模板
        const existingTemplates = await Template.find({ isDefault: true });
        if (existingTemplates.length === 0) {
            // 创建默认用户ID（用于预设模板）
            const defaultUserId = '60d0fe4f5311236168a109ca'; // 模拟的默认用户ID
            // 创建预设模板
            const templates = presetTemplates.map(template => ({
                ...template,
                createdBy: defaultUserId
            }));
            await Template.insertMany(templates);
            logger.info('预设模板初始化成功');
        }
        else {
            logger.info('预设模板已存在，跳过初始化');
        }
    }
    catch (error) {
        logger.error('预设模板初始化失败:', error);
    }
}
