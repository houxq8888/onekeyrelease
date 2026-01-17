import { WebSocket, WebSocketServer } from 'ws';
import { logger } from '../utils/logger';
import { PairingService } from './pairingService.js';
/**
 * WebSocket服务类
 * 管理设备连接和实时消息推送
 */
export class WebSocketService {
    static wss = null;
    static connections = new Map();
    /**
     * 初始化WebSocket服务器
     */
    static initialize(server) {
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
    static handleConnection(socket, request) {
        const url = new URL(request.url || '', `http://${request.headers.host}`);
        const deviceId = url.searchParams.get('deviceId');
        if (!deviceId) {
            socket.close(1008, '缺少设备ID');
            return;
        }
        // 检查设备是否已连接
        if (this.connections.has(deviceId)) {
            const existingConnection = this.connections.get(deviceId);
            existingConnection.socket.close(1000, '新连接建立');
        }
        const connection = {
            deviceId,
            socket,
            connectedAt: new Date(),
            lastPing: new Date()
        };
        this.connections.set(deviceId, connection);
        // 设置消息处理器
        socket.on('message', (data) => {
            this.handleMessage(deviceId, data.toString());
        });
        // 设置关闭处理器
        socket.on('close', (code, reason) => {
            this.handleDisconnection(deviceId, code, reason.toString());
        });
        // 设置错误处理器
        socket.on('error', (error) => {
            logger.error(`WebSocket错误: ${deviceId}`, { error: error.message });
            this.handleDisconnection(deviceId, 1006, error.message);
        });
        // 处理配对连接
        PairingService.handleWebSocketConnection(deviceId);
        // 发送连接成功消息
        this.sendToDevice(deviceId, {
            type: 'device_connected',
            data: {
                message: '连接成功',
                serverTime: new Date().toISOString(),
                connectionId: this.generateConnectionId()
            },
            timestamp: Date.now()
        });
        logger.info(`设备连接成功: ${deviceId}`);
    }
    /**
     * 处理设备断开连接
     */
    static handleDisconnection(deviceId, code, reason) {
        this.connections.delete(deviceId);
        logger.info(`设备断开连接: ${deviceId}`, { code, reason });
    }
    /**
     * 处理接收到的消息
     */
    static handleMessage(deviceId, message) {
        try {
            const parsedMessage = JSON.parse(message);
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
                case 'device_info_request':
                    this.handleDeviceInfoRequest(deviceId, parsedMessage.data);
                    break;
                case 'pairing_status':
                    this.handlePairingStatusRequest(deviceId, parsedMessage.data);
                    break;
                default:
                    logger.warn(`未知的WebSocket消息类型: ${parsedMessage.type}`, { deviceId });
            }
        }
        catch (error) {
            logger.error(`处理WebSocket消息失败: ${deviceId}`, {
                error: error.message,
                message
            });
        }
    }
    /**
     * 处理ping消息
     */
    static handlePing(deviceId) {
        this.sendToDevice(deviceId, {
            type: 'pong',
            data: { timestamp: Date.now() },
            timestamp: Date.now()
        });
    }
    /**
     * 处理任务状态请求
     */
    static handleTaskStatusRequest(deviceId, data) {
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
     * 处理设备信息请求
     */
    static handleDeviceInfoRequest(deviceId, _data) {
        // 返回设备连接信息
        const connection = this.connections.get(deviceId);
        if (!connection) {
            this.sendToDevice(deviceId, {
                type: 'device_info_response',
                data: {
                    error: '设备未连接'
                },
                timestamp: Date.now()
            });
            return;
        }
        this.sendToDevice(deviceId, {
            type: 'device_info_response',
            data: {
                deviceId,
                connectedAt: connection.connectedAt.toISOString(),
                lastPing: connection.lastPing.toISOString(),
                connectionId: this.generateConnectionId()
            },
            timestamp: Date.now()
        });
    }
    /**
     * 处理配对状态请求
     */
    static handlePairingStatusRequest(deviceId, _data) {
        // 查找相关的配对会话
        const activeSessions = PairingService.getActiveSessions();
        const session = activeSessions.find(s => s.pairedDevice?.deviceId === deviceId);
        if (!session) {
            this.sendToDevice(deviceId, {
                type: 'pairing_status',
                data: {
                    status: 'not_paired',
                    message: '设备未配对'
                },
                timestamp: Date.now()
            });
            return;
        }
        this.sendToDevice(deviceId, {
            type: 'pairing_status',
            data: {
                status: session.status,
                sessionId: session.sessionId,
                pairedAt: session.pairedDevice?.pairedAt.toISOString(),
                message: `配对状态: ${session.status}`
            },
            timestamp: Date.now()
        });
    }
    /**
     * 发送消息到设备
     */
    static sendToDevice(deviceId, message) {
        const connection = this.connections.get(deviceId);
        if (!connection || connection.socket.readyState !== WebSocket.OPEN) {
            logger.warn(`设备未连接或连接已关闭: ${deviceId}`);
            return false;
        }
        try {
            const fullMessage = {
                ...message,
                deviceId
            };
            connection.socket.send(JSON.stringify(fullMessage));
            return true;
        }
        catch (error) {
            logger.error(`发送WebSocket消息失败: ${deviceId}`, { error: error.message });
            return false;
        }
    }
    /**
     * 通知设备任务完成
     */
    static async notifyDevice(deviceId, data) {
        return this.sendToDevice(deviceId, {
            type: 'task_completed',
            data,
            timestamp: Date.now()
        });
    }
    /**
     * 通知设备任务失败
     */
    static async notifyTaskFailed(deviceId, taskId, error) {
        return this.sendToDevice(deviceId, {
            type: 'task_failed',
            data: { taskId, error },
            timestamp: Date.now()
        });
    }
    /**
     * 发送进度更新
     */
    static async sendProgressUpdate(deviceId, taskId, progress) {
        return this.sendToDevice(deviceId, {
            type: 'progress_update',
            data: { taskId, progress },
            timestamp: Date.now()
        });
    }
    /**
     * 发送通知消息
     */
    static async sendNotification(deviceId, title, message) {
        return this.sendToDevice(deviceId, {
            type: 'notification',
            data: { title, message },
            timestamp: Date.now()
        });
    }
    /**
     * 广播消息到所有设备
     */
    static broadcast(message) {
        this.connections.forEach((_connection, deviceId) => {
            this.sendToDevice(deviceId, message);
        });
    }
    /**
     * 获取连接设备数量
     */
    static getConnectedDeviceCount() {
        return this.connections.size;
    }
    /**
     * 获取所有连接设备
     */
    static getConnectedDevices() {
        return Array.from(this.connections.keys());
    }
    /**
     * 检查设备是否连接
     */
    static isDeviceConnected(deviceId) {
        const connection = this.connections.get(deviceId);
        return connection ? connection.socket.readyState === WebSocket.OPEN : false;
    }
    /**
     * 清理空闲连接
     */
    static cleanupIdleConnections(timeout = 300000) {
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
    /**
     * 生成连接ID
     */
    static generateConnectionId() {
        return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * 发送配对完成消息
     */
    static async sendPairingComplete(deviceId, sessionId) {
        return this.sendToDevice(deviceId, {
            type: 'pairing_complete',
            data: {
                sessionId,
                message: '配对完成',
                completedAt: new Date().toISOString()
            },
            timestamp: Date.now()
        });
    }
    /**
     * 获取设备连接信息
     */
    static getDeviceConnectionInfo(deviceId) {
        const connection = this.connections.get(deviceId);
        if (!connection || connection.socket.readyState !== WebSocket.OPEN) {
            return { isConnected: false };
        }
        return {
            isConnected: true,
            connectedAt: connection.connectedAt.toISOString(),
            lastPing: connection.lastPing.toISOString(),
            connectionId: this.generateConnectionId()
        };
    }
    /**
     * 定期清理过期会话
     */
    static startSessionCleanup() {
        // 每5分钟清理一次过期会话
        setInterval(() => {
            PairingService.cleanupExpiredSessions();
            this.cleanupIdleConnections();
        }, 5 * 60 * 1000);
        logger.info('会话清理任务已启动');
    }
}
