import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { QRCodeService } from './qrCodeService';
import { MobileService } from './mobileService';

/**
 * 配对状态
 */
export enum PairingStatus {
  PENDING = 'pending',
  SCANNED = 'scanned',
  CONNECTED = 'connected',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * 配对会话信息
 */
export interface PairingSession {
  sessionId: string;
  deviceId: string;
  status: PairingStatus;
  qrCodeData: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  pairedDevice?: {
    deviceId: string;
    deviceName: string;
    platform: string;
    pairedAt: Date;
  };
}

/**
 * 设备配对服务类
 * 管理手机和PC端的配对过程
 */
export class PairingService {
  private static pairingSessions: Map<string, PairingSession> = new Map();
  private static sessionTimeout = 10 * 60 * 1000; // 10分钟超时

  /**
   * 创建新的配对会话
   */
  static async createPairingSession(serverUrl: string): Promise<{
    sessionId: string;
    qrCode: string;
    deviceId: string;
  }> {
    try {
      // 生成唯一的会话ID和设备ID
      const sessionId = this.generateSessionId();
      const deviceId = this.generateDeviceId();

      // 生成配对二维码
      const qrCode = await QRCodeService.generatePairingQRCode(deviceId, serverUrl);

      // 创建配对会话
      const session: PairingSession = {
        sessionId,
        deviceId,
        status: PairingStatus.PENDING,
        qrCodeData: qrCode,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + this.sessionTimeout)
      };

      this.pairingSessions.set(sessionId, session);

      logger.info(`创建配对会话: ${sessionId}`, { deviceId });

      return {
        sessionId,
        qrCode,
        deviceId
      };
    } catch (error: any) {
      logger.error('创建配对会话失败', { error: error.message });
      throw new AppError('创建配对会话失败', 500);
    }
  }

  /**
   * 处理二维码扫描
   */
  static async handleQRCodeScan(sessionId: string, deviceInfo: {
    deviceId: string;
    deviceName: string;
    platform: string;
    version?: string;
  }): Promise<void> {
    try {
      const session = this.pairingSessions.get(sessionId);
      
      if (!session) {
        throw new AppError('配对会话不存在', 404);
      }

      if (session.status !== PairingStatus.PENDING) {
        throw new AppError('配对会话状态无效', 400);
      }

      // 检查会话是否过期
      if (session.expiresAt < new Date()) {
        this.pairingSessions.delete(sessionId);
        throw new AppError('配对会话已过期', 400);
      }

      // 更新会话状态
      session.status = PairingStatus.SCANNED;
      session.updatedAt = new Date();
      session.pairedDevice = {
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        platform: deviceInfo.platform,
        pairedAt: new Date()
      };

      // 注册设备
      await MobileService.registerDevice({
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
        platform: deviceInfo.platform as any,
        version: deviceInfo.version
      });

      logger.info(`二维码已扫描: ${sessionId}`, { deviceInfo });
    } catch (error: any) {
      logger.error('处理二维码扫描失败', { sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * 完成配对过程
   */
  static async completePairing(sessionId: string): Promise<void> {
    try {
      const session = this.pairingSessions.get(sessionId);
      
      if (!session) {
        throw new AppError('配对会话不存在', 404);
      }

      if (session.status !== PairingStatus.SCANNED) {
        throw new AppError('配对会话状态无效', 400);
      }

      // 更新会话状态
      session.status = PairingStatus.COMPLETED;
      session.updatedAt = new Date();

      logger.info(`配对完成: ${sessionId}`, { deviceId: session.deviceId });
    } catch (error: any) {
      logger.error('完成配对失败', { sessionId, error: error.message });
      throw error;
    }
  }

  /**
   * 获取配对会话状态
   */
  static getPairingStatus(sessionId: string): PairingSession | null {
    const session = this.pairingSessions.get(sessionId);
    
    if (!session) {
      return null;
    }

    // 检查会话是否过期
    if (session.expiresAt < new Date()) {
      this.pairingSessions.delete(sessionId);
      return null;
    }

    return session;
  }

  /**
   * 生成连接二维码
   */
  static async generateConnectionQRCode(deviceId: string, serverUrl: string): Promise<string> {
    try {
      const qrCode = await QRCodeService.generateConnectionQRCode(deviceId, serverUrl);
      
      logger.info(`生成连接二维码: ${deviceId}`);
      
      return qrCode;
    } catch (error: any) {
      logger.error('生成连接二维码失败', { deviceId, error: error.message });
      throw new AppError('生成连接二维码失败', 500);
    }
  }

  /**
   * 处理WebSocket连接
   */
  static async handleWebSocketConnection(deviceId: string): Promise<void> {
    try {
      // 查找相关的配对会话
      let targetSession: PairingSession | null = null;
      
      for (const session of this.pairingSessions.values()) {
        if (session.pairedDevice?.deviceId === deviceId) {
          targetSession = session;
          break;
        }
      }

      if (targetSession) {
        // 更新会话状态
        targetSession.status = PairingStatus.CONNECTED;
        targetSession.updatedAt = new Date();

        // 更新设备最后活动时间
        await MobileService.updateDeviceLastActive(deviceId);

        logger.info(`WebSocket连接建立: ${deviceId}`, { sessionId: targetSession.sessionId });
      }
    } catch (error: any) {
      logger.error('处理WebSocket连接失败', { deviceId, error: error.message });
    }
  }

  /**
   * 清理过期的配对会话
   */
  static cleanupExpiredSessions(): void {
    const now = new Date();
    let cleanedCount = 0;

    this.pairingSessions.forEach((session, sessionId) => {
      if (session.expiresAt < now) {
        this.pairingSessions.delete(sessionId);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      logger.info(`清理过期配对会话: ${cleanedCount} 个`);
    }
  }

  /**
   * 生成会话ID
   */
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成设备ID
   */
  private static generateDeviceId(): string {
    return `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取所有活跃的配对会话
   */
  static getActiveSessions(): PairingSession[] {
    const now = new Date();
    const activeSessions: PairingSession[] = [];

    this.pairingSessions.forEach((session) => {
      if (session.expiresAt > now) {
        activeSessions.push(session);
      }
    });

    return activeSessions;
  }

  /**
   * 获取配对统计信息
   */
  static getPairingStats(): {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    pendingSessions: number;
  } {
    const now = new Date();
    let totalSessions = 0;
    let activeSessions = 0;
    let completedSessions = 0;
    let pendingSessions = 0;

    this.pairingSessions.forEach((session) => {
      if (session.expiresAt > now) {
        totalSessions++;
        
        switch (session.status) {
          case PairingStatus.PENDING:
            pendingSessions++;
            break;
          case PairingStatus.SCANNED:
          case PairingStatus.CONNECTED:
            activeSessions++;
            break;
          case PairingStatus.COMPLETED:
            completedSessions++;
            break;
        }
      }
    });

    return {
      totalSessions,
      activeSessions,
      completedSessions,
      pendingSessions
    };
  }
}