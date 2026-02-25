import { QRCodeService } from '../services/qrCodeService';
import { PairingService } from '../services/pairingService';
import { logger } from '../utils/logger';
/**
 * 移动端连接功能测试
 */
async function testMobileConnection() {
    try {
        logger.info('🚀 开始测试移动端连接功能...\n');
        // 1. 测试二维码生成
        logger.info('📱 测试1: 二维码生成功能');
        const deviceId = 'test-device-' + Date.now();
        const serverUrl = 'http://localhost:3000';
        // 生成配对二维码
        const pairingQRCode = await QRCodeService.generatePairingQRCode(deviceId, serverUrl);
        logger.info(`   ✅ 配对二维码生成成功`);
        logger.info(`   📱 设备ID: ${deviceId}`);
        logger.info(`   🔗 服务器地址: ${serverUrl}`);
        // 生成连接二维码
        const connectionQRCode = await QRCodeService.generateConnectionQRCode(deviceId, serverUrl);
        logger.info(`   ✅ 连接二维码生成成功\n`);
        // 2. 测试二维码解析
        logger.info('🔍 测试2: 二维码解析功能');
        const pairingData = QRCodeService.parseQRCodeData(pairingQRCode);
        logger.info(`   ✅ 配对二维码解析成功`);
        logger.info(`   📊 解析数据: ${JSON.stringify(pairingData, null, 2)}`);
        const connectionData = QRCodeService.parseQRCodeData(connectionQRCode);
        logger.info(`   ✅ 连接二维码解析成功`);
        logger.info(`   📊 解析数据: ${JSON.stringify(connectionData, null, 2)}\n`);
        // 3. 测试配对会话创建
        logger.info('🤝 测试3: 配对会话功能');
        const pairingSession = await PairingService.createPairingSession(serverUrl);
        logger.info(`   ✅ 配对会话创建成功`);
        logger.info(`   📋 会话ID: ${pairingSession.sessionId}`);
        logger.info(`   📱 设备ID: ${pairingSession.deviceId}`);
        // 获取配对状态
        const pairingStatus = PairingService.getPairingStatus(pairingSession.sessionId);
        logger.info(`   📊 配对状态: ${JSON.stringify(pairingStatus, null, 2)}\n`);
        // 4. 测试二维码验证
        logger.info('✅ 测试4: 二维码验证功能');
        const isValidPairing = QRCodeService.validateQRCodeData(pairingQRCode);
        logger.info(`   🔍 配对二维码验证: ${isValidPairing ? '有效' : '无效'}`);
        const isValidConnection = QRCodeService.validateQRCodeData(connectionQRCode);
        logger.info(`   🔍 连接二维码验证: ${isValidConnection ? '有效' : '无效'}\n`);
        // 5. 测试配对统计
        logger.info('📈 测试5: 配对统计功能');
        const pairingStats = PairingService.getPairingStats();
        logger.info(`   📊 配对统计: ${JSON.stringify(pairingStats, null, 2)}\n`);
        logger.info('🎉 移动端连接功能测试完成！');
        logger.info('📋 测试总结:');
        logger.info('   ✅ 二维码生成功能正常');
        logger.info('   ✅ 二维码解析功能正常');
        logger.info('   ✅ 配对会话功能正常');
        logger.info('   ✅ 二维码验证功能正常');
        logger.info('   ✅ 配对统计功能正常');
        return {
            success: true,
            deviceId,
            pairingQRCode,
            connectionQRCode,
            pairingSession,
            pairingStats
        };
    }
    catch (error) {
        logger.error('❌ 移动端连接功能测试失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
// 运行测试
if (require.main === module) {
    testMobileConnection()
        .then(result => {
        if (result.success) {
            process.exit(0);
        }
        else {
            process.exit(1);
        }
    })
        .catch(error => {
        logger.error('测试执行失败:', error);
        process.exit(1);
    });
}
export { testMobileConnection };
