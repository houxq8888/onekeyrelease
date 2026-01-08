import { QRCodeService } from '../services/qrCodeService.js';
/**
 * 简单的二维码生成测试
 */
async function testQRCodeGeneration() {
    console.log('🚀 开始测试二维码生成功能...\n');
    try {
        // 测试1: 设备配对二维码
        console.log('1. 测试设备配对二维码生成...');
        const pairingQRCode = await QRCodeService.generatePairingQRCode('test-device-001', 'http://localhost:3000', { width: 200 });
        if (pairingQRCode.startsWith('data:image/png;base64,')) {
            console.log('✅ 设备配对二维码生成成功');
            console.log(`   数据长度: ${pairingQRCode.length} 字符`);
        }
        else {
            throw new Error('二维码数据格式不正确');
        }
        // 测试2: WebSocket连接二维码
        console.log('\n2. 测试WebSocket连接二维码生成...');
        const connectionQRCode = await QRCodeService.generateConnectionQRCode('test-device-002', 'http://localhost:3000', { width: 250 });
        if (connectionQRCode.startsWith('data:image/png;base64,')) {
            console.log('✅ WebSocket连接二维码生成成功');
            console.log(`   数据长度: ${connectionQRCode.length} 字符`);
        }
        else {
            throw new Error('二维码数据格式不正确');
        }
        // 测试3: URL二维码
        console.log('\n3. 测试URL二维码生成...');
        const urlQRCode = await QRCodeService.generateURLQRCode('https://www.example.com/mobile-app', { width: 300 });
        if (urlQRCode.startsWith('data:image/png;base64,')) {
            console.log('✅ URL二维码生成成功');
            console.log(`   数据长度: ${urlQRCode.length} 字符`);
        }
        else {
            throw new Error('二维码数据格式不正确');
        }
        // 测试4: 文本二维码
        console.log('\n4. 测试文本二维码生成...');
        const textQRCode = await QRCodeService.generateTextQRCode('这是一段测试文本，用于生成二维码', { width: 280 });
        if (textQRCode.startsWith('data:image/png;base64,')) {
            console.log('✅ 文本二维码生成成功');
            console.log(`   数据长度: ${textQRCode.length} 字符`);
        }
        else {
            throw new Error('二维码数据格式不正确');
        }
        // 测试5: 二维码数据解析
        console.log('\n5. 测试二维码数据解析...');
        const testData = JSON.stringify({
            type: 'device_pairing',
            deviceId: 'test-device-003',
            serverUrl: 'http://localhost:3000',
            timestamp: Date.now(),
            version: '1.0.0'
        });
        const parsedData = QRCodeService.parseQRCodeData(testData);
        if (parsedData.type === 'device_pairing' && parsedData.deviceId === 'test-device-003') {
            console.log('✅ 二维码数据解析成功');
            console.log(`   解析结果: ${JSON.stringify(parsedData, null, 2)}`);
        }
        else {
            throw new Error('二维码数据解析失败');
        }
        // 测试6: 二维码数据验证
        console.log('\n6. 测试二维码数据验证...');
        const isValid = QRCodeService.validateQRCodeData(testData);
        if (isValid) {
            console.log('✅ 二维码数据验证成功');
        }
        else {
            throw new Error('二维码数据验证失败');
        }
        // 测试7: 批量生成二维码
        console.log('\n7. 测试批量生成二维码...');
        const devices = [
            { id: 'device-001', name: '设备1' },
            { id: 'device-002', name: '设备2' },
            { id: 'device-003', name: '设备3' }
        ];
        const batchResults = await QRCodeService.batchGenerateQRCode(devices, async (device) => {
            return await QRCodeService.generatePairingQRCode(device.id, 'http://localhost:3000', { width: 200 });
        });
        if (batchResults.length === devices.length) {
            console.log('✅ 批量生成二维码成功');
            console.log(`   成功生成 ${batchResults.length} 个二维码`);
        }
        else {
            throw new Error('批量生成二维码失败');
        }
        console.log('\n🎉 所有二维码功能测试通过！');
        console.log('\n📊 测试总结:');
        console.log('   - 设备配对二维码: ✅ 通过');
        console.log('   - WebSocket连接二维码: ✅ 通过');
        console.log('   - URL二维码: ✅ 通过');
        console.log('   - 文本二维码: ✅ 通过');
        console.log('   - 数据解析: ✅ 通过');
        console.log('   - 数据验证: ✅ 通过');
        console.log('   - 批量生成: ✅ 通过');
        console.log('\n🚀 二维码生成功能已准备就绪！');
    }
    catch (error) {
        console.error('\n❌ 二维码测试失败:', error.message);
        console.error('错误详情:', error);
        process.exit(1);
    }
}
// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
    testQRCodeGeneration();
}
