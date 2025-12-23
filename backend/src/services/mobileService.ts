import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { ContentService } from './contentService';
import { WebSocketService } from './websocketService';
import Device, { IDevice } from '../models/Device.js';
import { isMongoDBConnected, memoryStorage } from '../config/database.js';
import { FileStorage } from '../utils/fileStorage.js';

// 移动端指令类型
export type MobileCommand = 
  | 'generate_content'      // 生成内容
  | 'generate_images'       // 生成图片
  | 'generate_video'        // 生成视频
  | 'publish_content'       // 发布内容
  | 'batch_generate'        // 批量生成
  | 'get_status'           // 获取状态
  | 'list_contents';       // 列出内容

export interface MobileCommandRequest {
  deviceId: string;
  command: MobileCommand;
  params: any;
  platform: string;
}

export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: 'android' | 'ios' | 'web';
  version?: string;
  deviceType?: string;
  registeredAt: Date;
  lastActiveAt: Date;
  isOnline?: boolean;
}

export interface TaskStatus {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 移动端服务类
 * 处理手机端指令和内容管理
 */
export class MobileService {
  private static devices: Map<string, DeviceInfo> = new Map();
  private static tasks: Map<string, TaskStatus> = new Map();
  private static isInitialized = false;

  /**
   * 初始化移动端服务
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      // 初始化文件存储
      await FileStorage.initialize();
      
      // 如果不是MongoDB模式，从文件加载设备数据
      if (!isMongoDBConnected()) {
        this.devices = await FileStorage.loadDevices();
        logger.info(`从文件加载设备数据成功，共 ${this.devices.size} 个设备`);
      }
      
      this.isInitialized = true;
      logger.info('移动端服务初始化完成');
    } catch (error) {
      logger.error('移动端服务初始化失败:', error);
    }
  }

  /**
   * 注册设备
   */
  static async registerDevice(deviceInfo: Omit<DeviceInfo, 'registeredAt' | 'lastActiveAt'>): Promise<DeviceInfo> {
    try {
      if (isMongoDBConnected()) {
        // 使用MongoDB持久化存储
        const deviceData = {
          deviceId: deviceInfo.deviceId,
          deviceName: deviceInfo.deviceName,
          platform: deviceInfo.platform,
          version: deviceInfo.version || '1.0.0',
          deviceType: deviceInfo.deviceType,
          registeredAt: new Date(),
          lastActiveAt: new Date(0),
          isOnline: false,
          status: 'active' as const
        };

        // 检查设备是否已存在
        const existingDevice = await Device.findOne({ deviceId: deviceInfo.deviceId });
        
        if (existingDevice) {
          // 更新现有设备信息
          const updatedDevice = await Device.findOneAndUpdate(
            { deviceId: deviceInfo.deviceId },
            { 
              deviceName: deviceInfo.deviceName,
              platform: deviceInfo.platform,
              version: deviceInfo.version,
              deviceType: deviceInfo.deviceType,
              lastActiveAt: new Date(0)
            },
            { new: true }
          );
          
          logger.info(`设备信息已更新: ${deviceInfo.deviceId}`, { deviceInfo });
          return this.mapDeviceToInfo(updatedDevice!);
        } else {
          // 创建新设备
          const device = new Device(deviceData);
          const savedDevice = await device.save();
          
          logger.info(`设备注册成功: ${deviceInfo.deviceId}`, { deviceInfo });
          return this.mapDeviceToInfo(savedDevice);
        }
      } else {
        // 使用内存存储（兼容模式）
        const device: DeviceInfo = {
          ...deviceInfo,
          registeredAt: new Date(),
          lastActiveAt: new Date(0) // 初始化为过去时间，避免立即显示在线
        };

        this.devices.set(deviceInfo.deviceId, device);
        
        // 保存设备数据到文件
        await FileStorage.saveDevices(this.devices);
        
        logger.info(`设备注册成功（内存模式）: ${deviceInfo.deviceId}`, { deviceInfo });
        
        return device;
      }
    } catch (error) {
      logger.error(`设备注册失败: ${deviceInfo.deviceId}`, { error, deviceInfo });
      throw new AppError('设备注册失败', 500);
    }
  }

  /**
   * 处理移动端指令
   */
  static async handleCommand(request: MobileCommandRequest): Promise<{ taskId: string; message: string }> {
    const { deviceId, command, params, platform } = request;

    // 验证设备是否存在
    if (!this.devices.has(deviceId)) {
      throw new AppError('设备未注册', 400);
    }

    // 更新设备活跃时间
    const device = this.devices.get(deviceId)!;
    device.lastActiveAt = new Date();

    // 生成任务ID
    const taskId = this.generateTaskId();

    // 创建任务状态
    const task: TaskStatus = {
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
  private static async processCommandAsync(
    taskId: string, 
    command: MobileCommand, 
    params: any, 
    platform: string,
    deviceId: string
  ): Promise<void> {
    try {
      const task = this.tasks.get(taskId);
      if (!task) return;

      task.status = 'processing';
      task.updatedAt = new Date();

      let result: any;

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

    } catch (error: any) {
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
  private static async handleGenerateContent(
    task: TaskStatus, 
    params: any, 
    _platform: string
  ): Promise<any> {
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
  private static async handleGenerateImages(task: TaskStatus, params: any): Promise<any> {
    task.progress = 50;
    
    const images = await ContentService.generateImages(
      params.theme, 
      params.count || 3
    );
    
    task.progress = 100;
    
    return { images };
  }

  /**
   * 处理视频生成指令
   */
  private static async handleGenerateVideo(task: TaskStatus, params: any): Promise<any> {
    task.progress = 50;
    
    const video = await ContentService.generateVideo(params.theme);
    
    task.progress = 100;
    
    return { video };
  }

  /**
   * 处理内容发布指令
   */
  private static async handlePublishContent(task: TaskStatus, params: any, platform: string): Promise<any> {
    task.progress = 50;
    
    const result = await ContentService.publishContent(
      params.content || '',
      params.images || [],
      params.video || '',
      platform
    );
    
    task.progress = 100;
    
    return result;
  }

  /**
   * 处理批量生成指令
   */
  private static async handleBatchGenerate(
    task: TaskStatus, 
    params: any, 
    _platform: string
  ): Promise<any> {
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
      } catch (error: any) {
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
  static async getTaskStatus(taskId: string): Promise<TaskStatus> {
    const task = this.tasks.get(taskId);
    
    if (!task) {
      throw new AppError('任务不存在', 404);
    }
    
    return task;
  }

  /**
   * 获取设备内容列表
   */
  static async getDeviceContents(
    _deviceId: string, 
    _page: number, 
    _pageSize: number
  ): Promise<{ contents: any[]; total: number }> {
    // 这里应该查询数据库，暂时返回模拟数据
    const contents: any[] = [];
    const total = 0;

    return { contents, total };
  }

  /**
   * 下载内容
   */
  static async downloadContent(contentId: string): Promise<any> {
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
  private static generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取所有设备
   */
  static getDevices(): DeviceInfo[] {
    return Array.from(this.devices.values());
  }

  /**
   * 获取所有任务
   */
  static getTasks(): TaskStatus[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 获取已注册设备列表
   */
  static async getRegisteredDevices(): Promise<DeviceInfo[]> {
    if (isMongoDBConnected()) {
      try {
        const devices = await Device.find({ status: 'active' });
        return devices.map(device => ({
          ...this.mapDeviceToInfo(device),
          isOnline: this.isDeviceOnline(device.deviceId)
        }));
      } catch (error) {
        logger.error('获取设备列表失败', { error });
        return [];
      }
    } else {
      return Array.from(this.devices.values()).map(device => ({
        ...device,
        isOnline: this.isDeviceOnline(device.deviceId)
      }));
    }
  }

  /**
   * 获取设备状态
   */
  static async getDeviceStatus(deviceId: string): Promise<{
    device: DeviceInfo;
    isOnline: boolean;
    lastActive: Date;
    activeTasks: number;
    completedTasks: number;
  }> {
    let device: DeviceInfo | null = null;
    
    if (isMongoDBConnected()) {
      const dbDevice = await Device.findOne({ deviceId });
      if (!dbDevice) {
        throw new AppError('设备不存在', 404);
      }
      device = this.mapDeviceToInfo(dbDevice);
    } else {
      device = this.devices.get(deviceId) || null;
      if (!device) {
        throw new AppError('设备不存在', 404);
      }
    }

    const tasks = Array.from(this.tasks.values());
    const deviceTasks = tasks.filter(task => 
      task.result && task.result.deviceId === deviceId
    );

    return {
      device,
      isOnline: this.isDeviceOnline(deviceId),
      lastActive: device.lastActiveAt,
      activeTasks: deviceTasks.filter(task => 
        task.status === 'pending' || task.status === 'processing'
      ).length,
      completedTasks: deviceTasks.filter(task => 
        task.status === 'completed'
      ).length
    };
  }

  /**
   * 检查设备是否在线
   */
  private static isDeviceOnline(deviceId: string): boolean {
    let device: DeviceInfo | null = null;
    
    if (isMongoDBConnected()) {
      try {
        const dbDevice = Device.findOne({ deviceId });
        if (!dbDevice) return false;
        device = this.mapDeviceToInfo(dbDevice);
      } catch (error) {
        return false;
      }
    } else {
      device = this.devices.get(deviceId) || null;
    }
    
    if (!device) return false;
    
    // 如果设备在最近5分钟内活跃，则认为在线
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return device.lastActiveAt > fiveMinutesAgo;
  }

  /**
    * 将数据库设备对象映射为DeviceInfo接口
    */
   private static mapDeviceToInfo(dbDevice: any): DeviceInfo {
     return {
       deviceId: dbDevice.deviceId,
       deviceName: dbDevice.deviceName,
       platform: dbDevice.platform,
       version: dbDevice.version,
       deviceType: dbDevice.deviceType,
       registeredAt: dbDevice.registeredAt,
       lastActiveAt: dbDevice.lastActiveAt,
       isOnline: dbDevice.isOnline
     };
   }

   /**
    * 更新设备最后活动时间
    */
   static async updateDeviceLastActive(deviceId: string): Promise<void> {
     try {
       if (isMongoDBConnected()) {
         await Device.findOneAndUpdate(
           { deviceId },
           { lastActiveAt: new Date() }
         );
       } else {
         const device = this.devices.get(deviceId);
         if (device) {
           device.lastActiveAt = new Date();
           this.devices.set(deviceId, device);
         }
       }
     } catch (error) {
       logger.error(`更新设备活动时间失败: ${deviceId}`, { error });
     }
   }

   /**
    * 删除设备
    */
   static async deleteDevice(deviceId: string): Promise<void> {
     try {
       if (isMongoDBConnected()) {
         await Device.findOneAndUpdate(
           { deviceId },
           { status: 'inactive' }
         );
       } else {
         this.devices.delete(deviceId);
       }
       logger.info(`设备已删除: ${deviceId}`);
     } catch (error) {
       logger.error(`删除设备失败: ${deviceId}`, { error });
       throw new AppError('删除设备失败', 500);
     }
   }
 }