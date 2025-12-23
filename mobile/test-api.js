// 移动应用API连接测试脚本
const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';

async function testApiConnection() {
  console.log('🚀 开始测试移动应用与后端服务的跨平台通信...\n');

  try {
    // 测试健康检查
    console.log('1. 测试后端服务健康检查...');
    const healthResponse = await axios.get('http://localhost:3000/health');
    console.log('✅ 健康检查成功:', healthResponse.data);

    // 测试移动端API信息
    console.log('\n2. 测试移动端API信息...');
    const mobileInfoResponse = await axios.get(`${API_BASE_URL}/mobile`);
    console.log('✅ 移动端API信息获取成功:', mobileInfoResponse.data);

    // 测试设备注册
    console.log('\n3. 测试设备注册API...');
    const deviceRegisterResponse = await axios.post(`${API_BASE_URL}/mobile/device/register`, {
      deviceId: 'test-device-001',
      deviceType: 'mobile',
      deviceName: '测试设备',
      platform: 'android'
    });
    console.log('✅ 设备注册成功:', deviceRegisterResponse.data);

    // 测试指令发送
    console.log('\n4. 测试指令发送API...');
    const commandResponse = await axios.post(`${API_BASE_URL}/mobile/command`, {
      deviceId: 'test-device-001',
      command: 'generate_content',
      params: {
        theme: '美食分享',
        keywords: ['美食', '探店', '推荐'],
        targetAudience: '年轻人',
        style: 'casual'
      },
      platform: 'xiaohongshu'
    });
    console.log('✅ 指令发送成功:', commandResponse.data);

    console.log('\n🎉 所有移动端API连接测试成功！跨平台通信功能正常。');
    
  } catch (error) {
    console.error('❌ API连接测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testApiConnection();