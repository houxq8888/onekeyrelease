import axios from 'axios';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

const API_BASE_URL = 'http://localhost:3000/api/v1';

class DeviceService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });
  }

  // 获取设备信息
  getDeviceInfo() {
    return {
      platform: Platform.OS,
      deviceModel: Device.modelName || 'Unknown',
      osVersion: Platform.Version,
      appVersion: Constants.expoConfig?.version || '1.0.0',
      deviceId: Constants.deviceId || 'unknown',
      manufacturer: Device.manufacturer || 'Unknown',
    };
  }

  // 注册设备
  async registerDevice(deviceInfo = null) {
    const info = deviceInfo || this.getDeviceInfo();
    
    try {
      const response = await this.api.post('/mobile/device/register', {
        deviceInfo: info,
        timestamp: new Date().toISOString(),
      });
      
      return response;
    } catch (error) {
      console.error('设备注册失败:', error);
      throw error;
    }
  }

  // 连接WebSocket
  async connectWebSocket(deviceId) {
    // WebSocket连接逻辑将在WebSocketService中实现
    // 这里返回一个模拟的成功响应
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 100);
    });
  }

  // 获取设备状态
  async getDeviceStatus(deviceId) {
    try {
      const response = await this.api.get(`/mobile/device/status/${deviceId}`);
      return response;
    } catch (error) {
      console.error('获取设备状态失败:', error);
      throw error;
    }
  }

  // 断开设备连接
  async disconnectDevice(deviceId) {
    try {
      const response = await this.api.post('/mobile/device/disconnect', {
        deviceId,
      });
      return response;
    } catch (error) {
      console.error('断开设备连接失败:', error);
      throw error;
    }
  }
}

export const deviceService = new DeviceService();
export { DeviceService };