import QRCode from 'qrcode';
import { logger } from '../utils/logger';

/**
 * 二维码服务类
 * 生成设备配对二维码和连接二维码
 */
export class QRCodeService {
  /**
   * 生成设备配对二维码
   * @param deviceId 设备ID
   * @param serverUrl 服务器地址
   * @param options 二维码选项
   */
  static async generatePairingQRCode(
    deviceId: string, 
    serverUrl: string,
    options: { width?: number; margin?: number; color?: { dark: string; light: string } } = {}
  ): Promise<string> {
    try {
      const pairingData = {
        type: 'device_pairing',
        deviceId,
        serverUrl,
        timestamp: Date.now(),
        version: '1.0.0'
      };

      const qrCodeData = JSON.stringify(pairingData);
      const qrCode = await QRCode.toDataURL(qrCodeData, {
        width: options.width || 300,
        margin: options.margin || 2,
        color: options.color || {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      logger.info(`生成设备配对二维码: ${deviceId}`);
      return qrCode;
    } catch (error: any) {
      logger.error('生成二维码失败', { error: error.message });
      throw new Error('生成二维码失败');
    }
  }

  /**
   * 生成WebSocket连接二维码
   * @param deviceId 设备ID
   * @param serverUrl 服务器地址
   * @param options 二维码选项
   */
  static async generateConnectionQRCode(
    deviceId: string, 
    serverUrl: string,
    options: { width?: number; margin?: number; color?: { dark: string; light: string } } = {}
  ): Promise<string> {
    try {
      const wsUrl = serverUrl.replace('http', 'ws') + `/ws/mobile?deviceId=${deviceId}`;
      
      const connectionData = {
        type: 'websocket_connection',
        deviceId,
        wsUrl,
        timestamp: Date.now(),
        version: '1.0.0'
      };

      const qrCodeData = JSON.stringify(connectionData);
      const qrCode = await QRCode.toDataURL(qrCodeData, {
        width: options.width || 300,
        margin: options.margin || 2,
        color: options.color || {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      logger.info(`生成WebSocket连接二维码: ${deviceId}`);
      return qrCode;
    } catch (error: any) {
      logger.error('生成连接二维码失败', { error: error.message });
      throw new Error('生成连接二维码失败');
    }
  }

  /**
   * 生成直接URL二维码（用于快速访问）
   * @param url 要编码的URL
   * @param options 二维码选项
   */
  static async generateURLQRCode(
    url: string,
    options: { width?: number; margin?: number; color?: { dark: string; light: string } } = {}
  ): Promise<string> {
    try {
      const qrCode = await QRCode.toDataURL(url, {
        width: options.width || 300,
        margin: options.margin || 2,
        color: options.color || {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      logger.info(`生成URL二维码: ${url}`);
      return qrCode;
    } catch (error: any) {
      logger.error('生成URL二维码失败', { error: error.message });
      throw new Error('生成URL二维码失败');
    }
  }

  /**
   * 生成纯文本二维码
   * @param text 要编码的文本
   * @param options 二维码选项
   */
  static async generateTextQRCode(
    text: string,
    options: { width?: number; margin?: number; color?: { dark: string; light: string } } = {}
  ): Promise<string> {
    try {
      const qrCode = await QRCode.toDataURL(text, {
        width: options.width || 300,
        margin: options.margin || 2,
        color: options.color || {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      logger.info(`生成文本二维码: ${text.substring(0, 50)}...`);
      return qrCode;
    } catch (error: any) {
      logger.error('生成文本二维码失败', { error: error.message });
      throw new Error('生成文本二维码失败');
    }
  }

  /**
   * 生成SVG格式的二维码（用于Web显示）
   * @param data 要编码的数据
   * @param options SVG选项
   */
  static async generateSVGQRCode(
    data: string,
    options: { 
      width?: number; 
      margin?: number; 
      color?: { dark: string; light: string };
      type?: 'url' | 'text' | 'json';
    } = {}
  ): Promise<string> {
    try {
      const qrCode = await QRCode.toString(data, {
        type: 'svg',
        width: options.width || 300,
        margin: options.margin || 2,
        color: options.color || {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      logger.info(`生成SVG二维码: ${data.substring(0, 50)}...`);
      return qrCode;
    } catch (error: any) {
      logger.error('生成SVG二维码失败', { error: error.message });
      throw new Error('生成SVG二维码失败');
    }
  }

  /**
   * 解析二维码数据
   * @param qrCodeData 二维码数据
   */
  static parseQRCodeData(qrCodeData: string): any {
    try {
      const parsedData = JSON.parse(qrCodeData);
      
      // 验证数据格式
      if (!parsedData.type || !parsedData.deviceId || !parsedData.timestamp) {
        throw new Error('无效的二维码数据格式');
      }

      // 检查时间戳是否过期（5分钟内有效）
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (parsedData.timestamp < fiveMinutesAgo) {
        throw new Error('二维码已过期');
      }

      return parsedData;
    } catch (error: any) {
      logger.error('解析二维码数据失败', { error: error.message });
      throw new Error('解析二维码数据失败');
    }
  }

  /**
   * 验证二维码数据有效性
   * @param qrCodeData 二维码数据
   */
  static validateQRCodeData(qrCodeData: string): boolean {
    try {
      const parsedData = JSON.parse(qrCodeData);
      
      // 基本验证
      if (!parsedData.type || !parsedData.timestamp) {
        return false;
      }

      // 时间戳验证（10分钟内有效）
      const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
      if (parsedData.timestamp < tenMinutesAgo) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取二维码数据的基本信息
   * @param qrCodeData 二维码数据
   */
  static getQRCodeInfo(qrCodeData: string): {
    type: string;
    timestamp: number;
    isValid: boolean;
    ageInSeconds: number;
  } {
    try {
      const parsedData = JSON.parse(qrCodeData);
      const currentTime = Date.now();
      const ageInSeconds = Math.floor((currentTime - parsedData.timestamp) / 1000);
      
      return {
        type: parsedData.type || 'unknown',
        timestamp: parsedData.timestamp,
        isValid: this.validateQRCodeData(qrCodeData),
        ageInSeconds
      };
    } catch {
      return {
        type: 'invalid',
        timestamp: 0,
        isValid: false,
        ageInSeconds: 0
      };
    }
  }

  /**
   * 生成二维码数据URL（用于前端显示）
   * @param qrCodeData 二维码数据
   */
  static getQRCodeDataURL(qrCodeData: string): string {
    return `data:image/png;base64,${qrCodeData.split(',')[1]}`;
  }

  /**
   * 批量生成二维码
   * @param items 要生成二维码的项目数组
   * @param generator 二维码生成器函数
   */
  static async batchGenerateQRCode<T>(
    items: T[],
    generator: (item: T) => Promise<string>
  ): Promise<Array<{ item: T; qrCode: string }>> {
    const results: Array<{ item: T; qrCode: string }> = [];
    
    for (const item of items) {
      try {
        const qrCode = await generator(item);
        results.push({ item, qrCode });
      } catch (error: any) {
        logger.error(`批量生成二维码失败: ${error.message}`);
        // 继续处理其他项目
      }
    }
    
    return results;
  }
}