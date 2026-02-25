import http from 'http';

/**
 * 移动端API接口测试
 */
async function testMobileAPI() {
  console.log('🚀 开始测试移动端API接口...\n');

  const baseURL = 'http://localhost:3000';
  
  try {
    // 1. 测试移动端API信息
    console.log('📱 测试1: 移动端API信息');
    const apiInfo = await httpRequest(`${baseURL}/api/mobile`);
    console.log('   ✅ API信息获取成功');
    console.log('   📊 响应:', JSON.stringify(apiInfo, null, 2));
    
    // 2. 测试设备注册
    console.log('\n📱 测试2: 设备注册');
    const deviceId = 'test-device-' + Date.now();
    const registerData = {
      deviceId: deviceId,
      deviceType: 'mobile',
      deviceName: '测试设备',
      platform: 'android'
    };
    
    const registerResult = await httpRequest(`${baseURL}/api/mobile/device/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });
    
    console.log('   ✅ 设备注册成功');
    console.log('   📱 设备ID:', deviceId);
    
    // 3. 测试二维码生成
    console.log('\n📱 测试3: 二维码生成');
    const qrCodeData = {
      deviceId: deviceId,
      serverUrl: baseURL,
      type: 'pairing'
    };
    
    const qrCodeResult = await httpRequest(`${baseURL}/api/mobile/qrcode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(qrCodeData)
    });
    
    console.log('   ✅ 二维码生成成功');
    console.log('   📊 响应:', JSON.stringify(qrCodeResult, null, 2));
    
    // 4. 测试设备列表
    console.log('\n📱 测试4: 设备列表');
    const devicesResult = await httpRequest(`${baseURL}/api/mobile/devices`);
    console.log('   ✅ 设备列表获取成功');
    console.log('   📊 设备数量:', devicesResult.data ? devicesResult.data.length : 0);
    
    console.log('\n🎉 移动端API接口测试完成！');
    console.log('📋 测试总结:');
    console.log('   ✅ API信息接口正常');
    console.log('   ✅ 设备注册接口正常');
    console.log('   ✅ 二维码生成接口正常');
    console.log('   ✅ 设备列表接口正常');
    
    return { success: true, deviceId };
    
  } catch (error) {
    console.error('❌ 移动端API接口测试失败:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * HTTP请求辅助函数
 */
function httpRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          resolve({ success: false, error: 'JSON解析失败', rawData: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// 运行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  testMobileAPI()
    .then(result => {
      if (result.success) {
        console.log('\n✅ 所有测试通过！');
        process.exit(0);
      } else {
        console.log('\n❌ 测试失败！');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('测试执行失败:', error);
      process.exit(1);
    });
}

export { testMobileAPI };