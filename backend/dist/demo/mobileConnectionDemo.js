import { PairingService } from '../services/pairingService';
import { MobileService } from '../services/mobileService';
import { logger } from '../utils/logger';
/**
 * 手机连接PC端功能演示
 */
export class MobileConnectionDemo {
    /**
     * 运行演示
     */
    static async runDemo() {
        logger.info('🚀 开始手机连接PC端功能演示...\n');
        try {
            // 1. 演示配对会话创建
            await this.demoPairingSession();
            // 2. 演示设备注册
            await this.demoDeviceRegistration();
            // 3. 演示配对流程
            await this.demoPairingProcess();
            // 4. 演示统计信息
            this.demoStatistics();
            logger.info('\n✅ 演示完成！');
        }
        catch (error) {
            logger.error('❌ 演示失败', { error: error.message });
        }
    }
    /**
     * 演示配对会话创建
     */
    static async demoPairingSession() {
        logger.info('📱 1. 创建配对会话');
        const serverUrl = 'http://localhost:3000';
        // 创建配对会话
        const pairingSession = await PairingService.createPairingSession(serverUrl);
        logger.info(`   ✅ 会话ID: ${pairingSession.sessionId}`);
        logger.info(`   ✅ 设备ID: ${pairingSession.deviceId}`);
        logger.info(`   ✅ 二维码: ${pairingSession.qrCode.substring(0, 50)}...`);
        // 获取配对状态
        const status = PairingService.getPairingStatus(pairingSession.sessionId);
        logger.info(`   📊 当前状态: ${status?.status || '未知'}\n`);
    }
    /**
     * 演示设备注册
     */
    static async demoDeviceRegistration() {
        logger.info('📱 2. 设备注册演示');
        const deviceInfo = {
            deviceId: 'demo_device_001',
            deviceName: '演示设备',
            platform: 'android',
            version: '1.0.0'
        };
        // 注册设备
        const device = await MobileService.registerDevice(deviceInfo);
        logger.info(`   ✅ 设备注册成功: ${device.deviceId}`);
        // 获取设备状态
        const status = await MobileService.getDeviceStatus(deviceInfo.deviceId);
        logger.info(`   📊 设备状态: ${status.isOnline ? '在线' : '离线'}`);
        // 获取设备列表
        const devices = await MobileService.getRegisteredDevices();
        logger.info(`   📋 已注册设备数量: ${devices.length}\n`);
    }
    /**
     * 演示配对流程
     */
    static async demoPairingProcess() {
        logger.info('📱 3. 完整配对流程演示');
        const serverUrl = 'http://localhost:3000';
        // 创建配对会话
        const pairingSession = await PairingService.createPairingSession(serverUrl);
        logger.info(`   ✅ 创建会话: ${pairingSession.sessionId}`);
        // 模拟二维码扫描
        await PairingService.handleQRCodeScan(pairingSession.sessionId, {
            deviceId: 'demo_paired_device',
            deviceName: '已配对设备',
            platform: 'ios',
            version: '2.0.0'
        });
        logger.info('   ✅ 二维码扫描成功');
        // 模拟WebSocket连接
        await PairingService.handleWebSocketConnection('demo_paired_device');
        logger.info('   ✅ WebSocket连接建立');
        // 完成配对
        await PairingService.completePairing(pairingSession.sessionId);
        logger.info('   ✅ 配对完成');
        // 检查最终状态
        const finalStatus = PairingService.getPairingStatus(pairingSession.sessionId);
        logger.info(`   📊 最终状态: ${finalStatus?.status || '已过期'}\n`);
    }
    /**
     * 演示统计信息
     */
    static demoStatistics() {
        logger.info('📱 4. 统计信息');
        const pairingStats = PairingService.getPairingStats();
        logger.info(`   📊 总会话数: ${pairingStats.totalSessions}`);
        logger.info(`   🔄 活跃会话: ${pairingStats.activeSessions}`);
        logger.info(`   ✅ 已完成会话: ${pairingStats.completedSessions}`);
        logger.info(`   ⏳ 等待中会话: ${pairingStats.pendingSessions}`);
        // 获取活跃会话列表
        const activeSessions = PairingService.getActiveSessions();
        logger.info(`   📋 活跃会话数量: ${activeSessions.length}\n`);
    }
    /**
     * 获取API端点信息
     */
    static getAPIEndpoints() {
        return [
            {
                method: 'POST',
                path: '/api/v1/mobile/pairing/session',
                description: '创建配对会话'
            },
            {
                method: 'POST',
                path: '/api/v1/mobile/pairing/scan',
                description: '处理二维码扫描'
            },
            {
                method: 'POST',
                path: '/api/v1/mobile/pairing/complete',
                description: '完成配对'
            },
            {
                method: 'GET',
                path: '/api/v1/mobile/pairing/status/:sessionId',
                description: '获取配对状态'
            },
            {
                method: 'POST',
                path: '/api/v1/mobile/pairing/connection-qrcode',
                description: '生成连接二维码'
            },
            {
                method: 'GET',
                path: '/api/v1/mobile/pairing/stats',
                description: '获取配对统计'
            },
            {
                method: 'POST',
                path: '/api/v1/mobile/device/register',
                description: '注册设备'
            },
            {
                method: 'GET',
                path: '/api/v1/mobile/devices',
                description: '获取设备列表'
            },
            {
                method: 'GET',
                path: '/api/v1/mobile/device/status/:deviceId',
                description: '获取设备状态'
            }
        ];
    }
}
// 如果直接运行此文件，则执行演示
if (require.main === module) {
    logger.info('📱 手机连接PC端功能演示');
    logger.info('='.repeat(50));
    // 显示API端点信息
    const endpoints = MobileConnectionDemo.getAPIEndpoints();
    logger.info('\n🔗 可用API端点:');
    endpoints.forEach(endpoint => {
        logger.info(`   ${endpoint.method} ${endpoint.path} - ${endpoint.description}`);
    });
    logger.info('\n' + '='.repeat(50));
    // 运行演示
    MobileConnectionDemo.runDemo()
        .then(() => {
        logger.info('\n🎉 演示程序执行完毕！');
        process.exit(0);
    })
        .catch((error) => {
        logger.error('演示程序执行失败', { error: error.message });
        process.exit(1);
    });
}
