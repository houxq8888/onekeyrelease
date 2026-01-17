import { QRCodeService } from '../services/qrCodeService';
import { logger } from '../utils/logger';

/**
 * 二维码服务测试类
 */
export class QRCodeServiceTest {
  /**
   * 测试设备配对二维码生成
   */
  static async testPairingQRCode(): Promise<void> {
    logger.info('开始测试设备配对二维码生成...');
    
    try {
      const deviceId = 'test-device-001';
      const serverUrl = 'http://localhost:3000';
      
      const qrCode = await QRCodeService.generatePairingQRCode(deviceId, serverUrl, {
        width: 200,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // 验证二维码数据格式
      if (!qrCode.startsWith('data:image/png;base64,')) {
        throw new Error('二维码数据格式不正确');
      }
      
      logger.info('✅ 设备配对二维码生成测试通过');
      logger.info(`二维码数据长度: ${qrCode.length} 字符`);
      
    } catch (error: any) {
      logger.error('❌ 设备配对二维码生成测试失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 测试WebSocket连接二维码生成
   */
  static async testConnectionQRCode(): Promise<void> {
    logger.info('开始测试WebSocket连接二维码生成...');
    
    try {
      const deviceId = 'test-device-002';
      const serverUrl = 'http://localhost:3000';
      
      const qrCode = await QRCodeService.generateConnectionQRCode(deviceId, serverUrl, {
        width: 250,
        margin: 2
      });
      
      // 验证二维码数据格式
      if (!qrCode.startsWith('data:image/png;base64,')) {
        throw new Error('二维码数据格式不正确');
      }
      
      logger.info('✅ WebSocket连接二维码生成测试通过');
      logger.info(`二维码数据长度: ${qrCode.length} 字符`);
      
    } catch (error: any) {
      logger.error('❌ WebSocket连接二维码生成测试失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 测试URL二维码生成
   */
  static async testURLQRCode(): Promise<void> {
    logger.info('开始测试URL二维码生成...');
    
    try {
      const url = 'https://www.example.com/mobile-app';
      
      const qrCode = await QRCodeService.generateURLQRCode(url, {
        width: 300,
        margin: 3
      });
      
      // 验证二维码数据格式
      if (!qrCode.startsWith('data:image/png;base64,')) {
        throw new Error('二维码数据格式不正确');
      }
      
      logger.info('✅ URL二维码生成测试通过');
      logger.info(`二维码数据长度: ${qrCode.length} 字符`);
      
    } catch (error: any) {
      logger.error('❌ URL二维码生成测试失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 测试文本二维码生成
   */
  static async testTextQRCode(): Promise<void> {
    logger.info('开始测试文本二维码生成...');
    
    try {
      const text = '这是一段测试文本，用于生成二维码';
      
      const qrCode = await QRCodeService.generateTextQRCode(text, {
        width: 280,
        margin: 2
      });
      
      // 验证二维码数据格式
      if (!qrCode.startsWith('data:image/png;base64,')) {
        throw new Error('二维码数据格式不正确');
      }
      
      logger.info('✅ 文本二维码生成测试通过');
      logger.info(`二维码数据长度: ${qrCode.length} 字符`);
      
    } catch (error: any) {
      logger.error('❌ 文本二维码生成测试失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 测试SVG二维码生成
   */
  static async testSVGQRCode(): Promise<void> {
    logger.info('开始测试SVG二维码生成...');
    
    try {
      const data = '{"type": "test", "message": "SVG二维码测试"}';
      
      const qrCode = await QRCodeService.generateSVGQRCode(data, {
        width: 300,
        margin: 2,
        type: 'json'
      });
      
      // 验证SVG格式
      if (!qrCode.startsWith('<svg')) {
        throw new Error('SVG二维码格式不正确');
      }
      
      logger.info('✅ SVG二维码生成测试通过');
      logger.info(`SVG数据长度: ${qrCode.length} 字符`);
      
    } catch (error: any) {
      logger.error('❌ SVG二维码生成测试失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 测试二维码数据解析
   */
  static async testQRCodeParsing(): Promise<void> {
    logger.info('开始测试二维码数据解析...');
    
    try {
      // 测试有效数据
      const validData = JSON.stringify({
        type: 'device_pairing',
        deviceId: 'test-device-003',
        serverUrl: 'http://localhost:3000',
        timestamp: Date.now(),
        version: '1.0.0'
      });
      
      const parsedData = QRCodeService.parseQRCodeData(validData);
      
      if (parsedData.type !== 'device_pairing' || parsedData.deviceId !== 'test-device-003') {
        throw new Error('二维码数据解析结果不正确');
      }
      
      // 测试过期数据
      const expiredData = JSON.stringify({
        type: 'device_pairing',
        deviceId: 'test-device-004',
        serverUrl: 'http://localhost:3000',
        timestamp: Date.now() - 10 * 60 * 1000, // 10分钟前
        version: '1.0.0'
      });
      
      try {
        QRCodeService.parseQRCodeData(expiredData);
        throw new Error('过期数据应该抛出异常');
      } catch {
        // 预期行为
      }
      
      // 测试无效数据
      const invalidData = 'invalid-json-data';
      
      try {
        QRCodeService.parseQRCodeData(invalidData);
        throw new Error('无效数据应该抛出异常');
      } catch {
        // 预期行为
      }
      
      logger.info('✅ 二维码数据解析测试通过');
      
    } catch (error: any) {
      logger.error('❌ 二维码数据解析测试失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 测试二维码数据验证
   */
  static async testQRCodeValidation(): Promise<void> {
    logger.info('开始测试二维码数据验证...');
    
    try {
      // 测试有效数据
      const validData = JSON.stringify({
        type: 'websocket_connection',
        deviceId: 'test-device-005',
        wsUrl: 'ws://localhost:3000/ws/mobile?deviceId=test-device-005',
        timestamp: Date.now(),
        version: '1.0.0'
      });
      
      const isValid = QRCodeService.validateQRCodeData(validData);
      
      if (!isValid) {
        throw new Error('有效数据验证失败');
      }
      
      // 测试无效数据
      const invalidData = JSON.stringify({
        type: 'invalid_type',
        timestamp: Date.now() - 15 * 60 * 1000 // 15分钟前
      });
      
      const isInvalid = QRCodeService.validateQRCodeData(invalidData);
      
      if (isInvalid) {
        throw new Error('无效数据验证错误');
      }
      
      // 测试二维码信息获取
      const info = QRCodeService.getQRCodeInfo(validData);
      
      if (info.type !== 'websocket_connection' || !info.isValid) {
        throw new Error('二维码信息获取失败');
      }
      
      logger.info('✅ 二维码数据验证测试通过');
      logger.info(`二维码信息: ${JSON.stringify(info)}`);
      
    } catch (error: any) {
      logger.error('❌ 二维码数据验证测试失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 测试批量生成二维码
   */
  static async testBatchQRCodeGeneration(): Promise<void> {
    logger.info('开始测试批量生成二维码...');
    
    try {
      const devices = [
        { id: 'device-001', name: '设备1' },
        { id: 'device-002', name: '设备2' },
        { id: 'device-003', name: '设备3' }
      ];
      
      const results = await QRCodeService.batchGenerateQRCode(
        devices,
        async (device) => {
          return await QRCodeService.generatePairingQRCode(
            device.id, 
            'http://localhost:3000',
            { width: 200 }
          );
        }
      );
      
      if (results.length !== devices.length) {
        throw new Error('批量生成结果数量不正确');
      }
      
      for (const result of results) {
        if (!result.qrCode.startsWith('data:image/png;base64,')) {
          throw new Error('批量生成的二维码格式不正确');
        }
      }
      
      logger.info('✅ 批量生成二维码测试通过');
      logger.info(`成功生成 ${results.length} 个二维码`);
      
    } catch (error: any) {
      logger.error('❌ 批量生成二维码测试失败', { error: error.message });
      throw error;
    }
  }

  /**
   * 运行所有测试
   */
  static async runAllTests(): Promise<void> {
    logger.info('开始二维码服务功能测试...');
    
    try {
      await this.testPairingQRCode();
      await this.testConnectionQRCode();
      await this.testURLQRCode();
      await this.testTextQRCode();
      await this.testSVGQRCode();
      await this.testQRCodeParsing();
      await this.testQRCodeValidation();
      await this.testBatchQRCodeGeneration();
      
      logger.info('🎉 所有二维码服务测试通过！');
      
    } catch (error: any) {
      logger.error('❌ 二维码服务测试失败', { error: error.message });
      throw error;
    }
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  QRCodeServiceTest.runAllTests()
    .then(() => {
      console.log('二维码服务测试完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('二维码服务测试失败:', error);
      process.exit(1);
    });
}