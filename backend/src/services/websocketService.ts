import { WebSocket, WebSocketServer } from 'ws';
import { logger } from '../utils/logger';

// WebSocket消息类型
export type WebSocketMessageType = 
  | 'device_connected'      // 设备连接
  | 'device_disconnected'   // 设备断开
  | 'task_completed'        // 任务完成
  | 'task_failed'          // 任务失败
  | 'progress_update'      // 进度更新
  | 'notification'         // 通知消息
  | 'ping'                 // 心跳检测
  | 'pong'                 // 心跳响应
  | 'task_status_request'  // 任务状态请求
  | 'task_status_response' // 任务状态响应
  | 'connection_confirm'   // 连接确认
  | 'heartbeat';           // 心跳包

export interface WebSocketMessage {
  type: WebSocketMessageType;
  deviceId: string;
  data: any;
  timestamp: number;
}

export interface DeviceConnection {
  deviceId: string;
  socket: WebSocket;
  connectedAt: Date;
  lastPing: Date;
}

/**
 * WebSocket服务类
 * 管理设备连接和实时消息推送
 */
export class WebSocketService {
  private static wss: WebSocketServer | null = null;
  private static connections: Map<string, DeviceConnection> = new Map();

  /**
   * 初始化WebSocket服务器
   */
  static initialize(server: any): void {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/mobile'
    });

    this.wss.on('connection', (socket, request) => {
      this.handleConnection(socket, request);
    });

    logger.info('WebSocket服务器已启动');
  }

  /**
   * 处理设备连接
   */
  private static handleConnection(socket: WebSocket, request: any): void {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const deviceId = url.searchParams.get('deviceId');

    if (!deviceId) {
      socket.close(1008, '缺少设备ID');
      return;
    }

    // 检查设备是否已连接
    if (this.connections.has(deviceId)) {
      const existingConnection = this.connections.get(deviceId)!;
      existingConnection.socket.close(1000, '新连接建立');
    }

    const connection: DeviceConnection = {
      deviceId,
      socket,
      connectedAt: new Date(),
      lastPing: new Date()
    };

    this.connections.set(deviceId, connection);

    // 设置消息处理器
    socket.on('message', (data: Buffer) => {
      this.handleMessage(deviceId, data.toString());
    });

    // 设置关闭处理器
    socket.on('close', (code: number, reason: Buffer) => {
      this.handleDisconnection(deviceId, code, reason.toString());
    });

    // 设置错误处理器
    socket.on('error', (error: Error) => {
      logger.error(`WebSocket错误: ${deviceId}`, { error: error.message });
      this.handleDisconnection(deviceId, 1006, error.message);
    });

    // 发送连接成功消息
    this.sendToDevice(deviceId, {
      type: 'device_connected',
      data: { message: '连接成功' },
      timestamp: Date.now()
    });

    logger.info(`设备连接成功: ${deviceId}`);
  }

  /**
   * 处理设备断开连接
   */
  private static handleDisconnection(deviceId: string, code: number, reason: string): void {
    this.connections.delete(deviceId);
    
    logger.info(`设备断开连接: ${deviceId}`, { code, reason });
  }

  /**
   * 处理接收到的消息
   */
  private static handleMessage(deviceId: string, message: string): void {
    try {
      const parsedMessage = JSON.parse(message) as WebSocketMessage;
      
      // 更新最后ping时间
      const connection = this.connections.get(deviceId);
      if (connection) {
        connection.lastPing = new Date();
      }

      // 处理不同类型的消息
      switch (parsedMessage.type) {
        case 'ping':
          this.handlePing(deviceId);
          break;
          
        case 'task_status_request':
          this.handleTaskStatusRequest(deviceId, parsedMessage.data);
          break;
          
        default:
          logger.warn(`未知的WebSocket消息类型: ${parsedMessage.type}`, { deviceId });
      }

    } catch (error: any) {
      logger.error(`处理WebSocket消息失败: ${deviceId}`, { 
        error: error.message,
        message 
      });
    }
  }

  /**
   * 处理ping消息
   */
  private static handlePing(deviceId: string): void {
    this.sendToDevice(deviceId, {
      type: 'pong',
      data: { timestamp: Date.now() },
      timestamp: Date.now()
    });
  }

  /**
   * 处理任务状态请求
   */
  private static handleTaskStatusRequest(deviceId: string, data: any): void {
    // 这里应该查询任务状态并返回
    // 暂时返回模拟响应
    this.sendToDevice(deviceId, {
      type: 'task_status_response',
      data: {
        taskId: data.taskId,
        status: 'completed',
        progress: 100
      },
      timestamp: Date.now()
    });
  }

  /**
   * 发送消息到设备
   */
  static sendToDevice(deviceId: string, message: Omit<WebSocketMessage, 'deviceId'>): boolean {
    const connection = this.connections.get(deviceId);
    
    if (!connection || connection.socket.readyState !== WebSocket.OPEN) {
      logger.warn(`设备未连接或连接已关闭: ${deviceId}`);
      return false;
    }

    try {
      const fullMessage: WebSocketMessage = {
        ...message,
        deviceId
      };

      connection.socket.send(JSON.stringify(fullMessage));
      return true;
    } catch (error: any) {
      logger.error(`发送WebSocket消息失败: ${deviceId}`, { error: error.message });
      return false;
    }
  }

  /**
   * 通知设备任务完成
   */
  static async notifyDevice(deviceId: string, data: any): Promise<boolean> {
    return this.sendToDevice(deviceId, {
      type: 'task_completed',
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 通知设备任务失败
   */
  static async notifyTaskFailed(deviceId: string, taskId: string, error: string): Promise<boolean> {
    return this.sendToDevice(deviceId, {
      type: 'task_failed',
      data: { taskId, error },
      timestamp: Date.now()
    });
  }

  /**
   * 发送进度更新
   */
  static async sendProgressUpdate(deviceId: string, taskId: string, progress: number): Promise<boolean> {
    return this.sendToDevice(deviceId, {
      type: 'progress_update',
      data: { taskId, progress },
      timestamp: Date.now()
    });
  }

  /**
   * 发送通知消息
   */
  static async sendNotification(deviceId: string, title: string, message: string): Promise<boolean> {
    return this.sendToDevice(deviceId, {
      type: 'notification',
      data: { title, message },
      timestamp: Date.now()
    });
  }

  /**
   * 广播消息到所有设备
   */
  static broadcast(message: Omit<WebSocketMessage, 'deviceId'>): void {
    this.connections.forEach((_connection, deviceId) => {
      this.sendToDevice(deviceId, message);
    });
  }

  /**
   * 获取连接设备数量
   */
  static getConnectedDeviceCount(): number {
    return this.connections.size;
  }

  /**
   * 获取所有连接设备
   */
  static getConnectedDevices(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * 检查设备是否连接
   */
  static isDeviceConnected(deviceId: string): boolean {
    const connection = this.connections.get(deviceId);
    return connection ? connection.socket.readyState === WebSocket.OPEN : false;
  }

  /**
   * 清理空闲连接
   */
  static cleanupIdleConnections(timeout: number = 300000): void { // 5分钟
    const now = new Date();
    
    this.connections.forEach((connection, deviceId) => {
      const idleTime = now.getTime() - connection.lastPing.getTime();
      
      if (idleTime > timeout) {
        connection.socket.close(1000, '连接超时');
        this.connections.delete(deviceId);
        logger.info(`清理空闲连接: ${deviceId}`);
      }
    });
  }
}