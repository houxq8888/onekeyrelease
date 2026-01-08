// 简单的二维码生成测试
import { QRCodeService } from '../services/qrCodeService';

async function quickTest() {
  console.log('🚀 开始二维码生成测试...\n');
  
  try {
    // 测试设备配对二维码
    console.log('1. 生成设备配对二维码...');
    const qrCode = await QRCodeService.generatePairingQRCode(
      'test-device-001', 
      'http://localhost:3000'
    );
    
    if (qrCode && qrCode.startsWith('data:image/png;base64,')) {
      console.log('✅ 二维码生成成功！');
      console.log(`   数据长度: ${qrCode.length} 字符`);
      console.log(`   前50字符: ${qrCode.substring(0, 50)}...`);
    } else {
      console.error('❌ 二维码生成失败');
      return;
    }
    
    // 测试数据解析
    console.log('\n2. 测试二维码数据解析...');
    const testData = JSON.stringify({
      type: 'device_pairing',
      deviceId: 'test-device-001',
      serverUrl: 'http://localhost:3000',
      timestamp: Date.now(),
      version: '1.0.0'
    });
    
    try {
      const parsed = QRCodeService.parseQRCodeData(testData);
      console.log('✅ 数据解析成功');
      console.log(`   设备ID: ${parsed.deviceId}`);
      console.log(`   类型: ${parsed.type}`);
    } catch (error) {
      console.error('❌ 数据解析失败:', error);
    }
    
    console.log('\n🎉 二维码功能测试完成！');
    
  } catch (error: any) {
    console.error('❌ 测试失败:', error);
  }
}

// 直接运行测试
quickTest().catch(console.error);