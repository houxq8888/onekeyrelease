import fs from 'fs/promises';
import path from 'path';
import { logger } from './logger.js';

/**
 * 文件存储工具类
 * 用于在内存数据库模式下持久化数据
 */
export class FileStorage {
  private static storagePath = path.join(process.cwd(), 'data');
  private static devicesFile = path.join(this.storagePath, 'devices.json');

  /**
   * 初始化存储目录
   */
  static async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
      logger.info('文件存储目录初始化完成');
    } catch (error) {
      logger.error('文件存储目录初始化失败:', error);
    }
  }

  /**
   * 保存设备数据到文件
   */
  static async saveDevices(devices: Map<string, any>): Promise<void> {
    try {
      const devicesArray = Array.from(devices.entries()).map(([deviceId, device]) => ({
        deviceId,
        ...device
      }));
      
      const data = JSON.stringify(devicesArray, null, 2);
      await fs.writeFile(this.devicesFile, data, 'utf-8');
      logger.debug(`设备数据已保存到文件，共 ${devicesArray.length} 个设备`);
    } catch (error) {
      logger.error('保存设备数据到文件失败:', error);
    }
  }

  /**
   * 从文件加载设备数据
   */
  static async loadDevices(): Promise<Map<string, any>> {
    try {
      const data = await fs.readFile(this.devicesFile, 'utf-8');
      const devicesArray = JSON.parse(data);
      
      const devicesMap = new Map<string, any>();
      devicesArray.forEach((device: any) => {
        const { deviceId, ...deviceInfo } = device;
        devicesMap.set(deviceId, deviceInfo);
      });
      
      logger.info(`从文件加载设备数据成功，共 ${devicesMap.size} 个设备`);
      return devicesMap;
    } catch (error) {
      // 如果文件不存在，返回空Map
      if ((error as any).code === 'ENOENT') {
        logger.info('设备数据文件不存在，将创建新的存储');
        return new Map();
      }
      logger.error('从文件加载设备数据失败:', error);
      return new Map();
    }
  }

  /**
   * 清空设备数据
   */
  static async clearDevices(): Promise<void> {
    try {
      await fs.unlink(this.devicesFile);
      logger.info('设备数据文件已清空');
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        logger.info('设备数据文件不存在，无需清空');
        return;
      }
      logger.error('清空设备数据失败:', error);
    }
  }

  /**
   * 获取设备数据文件路径
   */
  static getDevicesFilePath(): string {
    return this.devicesFile;
  }
}