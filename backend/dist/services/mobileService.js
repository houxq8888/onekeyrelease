import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { ContentService } from './contentService';
import { WebSocketService } from './websocketService';
/**
 * 移动端服务类
 * 处理手机端指令和内容管理
 */
export class MobileService {
    static devices = new Map();
    static tasks = new Map();
    /**
     * 注册设备
     */
    static async registerDevice(deviceInfo) {
        const device = {
            ...deviceInfo,
            registeredAt: new Date(),
            lastActiveAt: new Date()
        };
        this.devices.set(deviceInfo.deviceId, device);
        logger.info(`设备注册成功: ${deviceInfo.deviceId}`, { deviceInfo });
        return device;
    }
    /**
     * 处理移动端指令
     */
    static async handleCommand(request) {
        const { deviceId, command, params, platform } = request;
        // 验证设备是否存在
        if (!this.devices.has(deviceId)) {
            throw new AppError('设备未注册', 400);
        }
        // 更新设备活跃时间
        const device = this.devices.get(deviceId);
        device.lastActiveAt = new Date();
        // 生成任务ID
        const taskId = this.generateTaskId();
        // 创建任务状态
        const task = {
            taskId,
            status: 'pending',
            progress: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.tasks.set(taskId, task);
        // 异步处理指令
        this.processCommandAsync(taskId, command, params, platform, deviceId);
        return {
            taskId,
            message: `指令已接收，任务ID: ${taskId}`
        };
    }
    /**
     * 异步处理指令
     */
    static async processCommandAsync(taskId, command, params, platform, deviceId) {
        try {
            const task = this.tasks.get(taskId);
            if (!task)
                return;
            task.status = 'processing';
            task.updatedAt = new Date();
            let result;
            switch (command) {
                case 'generate_content':
                    result = await this.handleGenerateContent(task, params, platform);
                    break;
                case 'generate_images':
                    result = await this.handleGenerateImages(task, params);
                    break;
                case 'generate_video':
                    result = await this.handleGenerateVideo(task, params);
                    break;
                case 'publish_content':
                    result = await this.handlePublishContent(task, params, platform);
                    break;
                case 'batch_generate':
                    result = await this.handleBatchGenerate(task, params, platform);
                    break;
                default:
                    throw new AppError(`不支持的指令: ${command}`, 400);
            }
            task.status = 'completed';
            task.progress = 100;
            task.result = result;
            task.updatedAt = new Date();
            // 通过WebSocket通知移动端
            await WebSocketService.notifyDevice(deviceId, {
                type: 'task_completed',
                taskId,
                result
            });
            logger.info(`指令处理完成: ${command}`, { taskId, deviceId });
        }
        catch (error) {
            const task = this.tasks.get(taskId);
            if (task) {
                task.status = 'failed';
                task.error = error.message;
                task.updatedAt = new Date();
            }
            // 通过WebSocket通知移动端错误
            await WebSocketService.notifyDevice(deviceId, {
                type: 'task_failed',
                taskId,
                error: error.message
            });
            logger.error(`指令处理失败: ${command}`, {
                taskId,
                deviceId,
                error: error.message
            });
        }
    }
    /**
     * 处理内容生成指令
     */
    static async handleGenerateContent(task, params, _platform) {
        task.progress = 10;
        const config = {
            theme: params.theme || '默认主题',
            keywords: params.keywords || [],
            targetAudience: params.targetAudience || '普通用户',
            style: params.style || 'casual',
            wordCount: params.wordCount || 500
        };
        task.progress = 30;
        const content = await ContentService.generateContent(config);
        task.progress = 60;
        // 生成图片
        const images = await ContentService.generateImages(config.theme, 3);
        task.progress = 80;
        // 生成视频（可选）
        let video = '';
        if (params.generateVideo) {
            video = await ContentService.generateVideo(config.theme);
        }
        task.progress = 100;
        return {
            content,
            images,
            video,
            platform: _platform
        };
    }
    /**
     * 处理图片生成指令
     */
    static async handleGenerateImages(task, params) {
        task.progress = 50;
        const images = await ContentService.generateImages(params.theme, params.count || 3);
        task.progress = 100;
        return { images };
    }
    /**
     * 处理视频生成指令
     */
    static async handleGenerateVideo(task, params) {
        task.progress = 50;
        const video = await ContentService.generateVideo(params.theme);
        task.progress = 100;
        return { video };
    }
    /**
     * 处理内容发布指令
     */
    static async handlePublishContent(task, params, platform) {
        task.progress = 50;
        const result = await ContentService.publishContent(params.content || '', params.images || [], params.video || '', platform);
        task.progress = 100;
        return result;
    }
    /**
     * 处理批量生成指令
     */
    static async handleBatchGenerate(task, params, _platform) {
        const themes = params.themes || [];
        const results = [];
        for (let i = 0; i < themes.length; i++) {
            const theme = themes[i];
            task.progress = Math.floor((i / themes.length) * 100);
            try {
                const content = await ContentService.generateContent({
                    theme,
                    keywords: params.keywords || [],
                    targetAudience: params.targetAudience || '普通用户',
                    style: params.style || 'casual',
                    wordCount: params.wordCount || 500
                });
                const images = await ContentService.generateImages(theme, 3);
                results.push({
                    theme,
                    content,
                    images,
                    status: 'success'
                });
            }
            catch (error) {
                results.push({
                    theme,
                    error: error.message,
                    status: 'failed'
                });
            }
        }
        task.progress = 100;
        return { results };
    }
    /**
     * 获取任务状态
     */
    static async getTaskStatus(taskId) {
        const task = this.tasks.get(taskId);
        if (!task) {
            throw new AppError('任务不存在', 404);
        }
        return task;
    }
    /**
     * 获取设备内容列表
     */
    static async getDeviceContents(_deviceId, _page, _pageSize) {
        // 这里应该查询数据库，暂时返回模拟数据
        const contents = [];
        const total = 0;
        return { contents, total };
    }
    /**
     * 下载内容
     */
    static async downloadContent(contentId) {
        // 这里应该从数据库查询内容
        // 暂时返回模拟数据
        return {
            id: contentId,
            title: '示例内容',
            content: '这是生成的内容示例',
            images: [],
            createdAt: new Date()
        };
    }
    /**
     * 生成任务ID
     */
    static generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * 获取所有设备
     */
    static getDevices() {
        return Array.from(this.devices.values());
    }
    /**
     * 获取所有任务
     */
    static getTasks() {
        return Array.from(this.tasks.values());
    }
    /**
     * 获取已注册设备列表
     */
    static async getRegisteredDevices() {
        return Array.from(this.devices.values()).map(device => ({
            ...device,
            isOnline: this.isDeviceOnline(device.deviceId)
        }));
    }
    /**
     * 获取设备状态
     */
    static async getDeviceStatus(deviceId) {
        const device = this.devices.get(deviceId);
        if (!device) {
            throw new AppError('设备不存在', 404);
        }
        const tasks = Array.from(this.tasks.values());
        const deviceTasks = tasks.filter(task => task.result && task.result.deviceId === deviceId);
        return {
            device,
            isOnline: this.isDeviceOnline(deviceId),
            lastActive: device.lastActiveAt,
            activeTasks: deviceTasks.filter(task => task.status === 'pending' || task.status === 'processing').length,
            completedTasks: deviceTasks.filter(task => task.status === 'completed').length
        };
    }
    /**
     * 检查设备是否在线
     */
    static isDeviceOnline(deviceId) {
        const device = this.devices.get(deviceId);
        if (!device)
            return false;
        // 如果设备在最近5分钟内活跃，则认为在线
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return device.lastActiveAt > fiveMinutesAgo;
    }
}
