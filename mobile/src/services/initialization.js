import { store } from '../store/store';
import { registerDevice, connectWebSocket } from '../store/slices/deviceSlice';
import { deviceService } from './deviceService';
import { webSocketService } from './websocketService';
import { notificationService } from './notificationService';

// 应用初始化配置
const INIT_CONFIG = {
  maxRetryAttempts: 3,
  retryDelay: 2000,
  timeout: 10000,
};

class InitializationService {
  constructor() {
    this.isInitialized = false;
    this.retryCount = 0;
  }

  // 初始化应用
  async initializeApp() {
    if (this.isInitialized) {
      console.log('应用已经初始化');
      return true;
    }

    try {
      console.log('开始初始化应用...');

      // 1. 初始化通知服务
      await this.initializeNotifications();

      // 2. 注册设备
      const deviceInfo = await this.registerDevice();
      
      if (!deviceInfo) {
        throw new Error('设备注册失败');
      }

      // 3. 连接WebSocket
      await this.connectWebSocket(deviceInfo.deviceId);

      // 4. 启动心跳检测
      this.startHeartbeat(deviceInfo.deviceId);

      this.isInitialized = true;
      console.log('应用初始化完成');
      
      return true;
    } catch (error) {
      console.error('应用初始化失败:', error);
      
      // 重试逻辑
      if (this.retryCount < INIT_CONFIG.maxRetryAttempts) {
        this.retryCount++;
        console.log(`将在 ${INIT_CONFIG.retryDelay / 1000} 秒后重试 (${this.retryCount}/${INIT_CONFIG.maxRetryAttempts})`);
        
        setTimeout(() => {
          this.initializeApp();
        }, INIT_CONFIG.retryDelay);
        
        return false;
      } else {
        console.error('达到最大重试次数，初始化失败');
        return false;
      }
    }
  }

  // 初始化通知服务
  async initializeNotifications() {
    try {
      await notificationService.init();
      const hasPermission = await notificationService.requestPermissions();
      
      if (!hasPermission) {
        console.warn('通知权限未授予，部分功能可能受限');
      }
      
      return hasPermission;
    } catch (error) {
      console.error('通知服务初始化失败:', error);
      throw error;
    }
  }

  // 注册设备
  async registerDevice() {
    try {
      const deviceInfo = deviceService.getDeviceInfo();
      
      // 使用Redux异步action注册设备
      const result = await store.dispatch(registerDevice(deviceInfo));
      
      if (result.type.endsWith('/fulfilled')) {
        return result.payload;
      } else {
        throw new Error(result.payload || '设备注册失败');
      }
    } catch (error) {
      console.error('设备注册失败:', error);
      throw error;
    }
  }

  // 连接WebSocket
  async connectWebSocket(deviceId) {
    try {
      // 使用Redux异步action连接WebSocket
      const result = await store.dispatch(connectWebSocket(deviceId));
      
      if (result.type.endsWith('/fulfilled')) {
        // 实际连接WebSocket
        webSocketService.connect(deviceId);
        return true;
      } else {
        throw new Error(result.payload || 'WebSocket连接失败');
      }
    } catch (error) {
      console.error('WebSocket连接失败:', error);
      throw error;
    }
  }

  // 启动心跳检测
  startHeartbeat(deviceId) {
    // 每30秒发送一次心跳包
    setInterval(() => {
      if (webSocketService.getConnectionStatus() === 'connected') {
        webSocketService.sendHeartbeat();
      }
    }, 30000);

    // 监听网络状态变化
    if (typeof NetInfo !== 'undefined') {
      NetInfo.addEventListener(state => {
        this.handleNetworkChange(state, deviceId);
      });
    }
  }

  // 处理网络状态变化
  handleNetworkChange(networkState, deviceId) {
    console.log('网络状态变化:', networkState);
    
    if (networkState.isConnected && networkState.isInternetReachable) {
      // 网络恢复，重新连接WebSocket
      if (webSocketService.getConnectionStatus() !== 'connected') {
        console.log('网络恢复，重新连接WebSocket');
        webSocketService.connect(deviceId);
      }
    } else {
      // 网络断开
      console.log('网络断开，WebSocket连接将中断');
    }
  }

  // 重置初始化状态
  reset() {
    this.isInitialized = false;
    this.retryCount = 0;
    
    // 断开WebSocket连接
    webSocketService.disconnect();
    
    console.log('应用初始化状态已重置');
  }

  // 获取初始化状态
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      retryCount: this.retryCount,
      maxRetryAttempts: INIT_CONFIG.maxRetryAttempts,
    };
  }

  // 检查后端服务可用性
  async checkBackendAvailability() {
    try {
      const response = await fetch('http://localhost:3000/api/v1/info', {
        method: 'GET',
        timeout: 5000,
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          available: true,
          version: data.version,
          uptime: data.uptime,
        };
      } else {
        return {
          available: false,
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      return {
        available: false,
        error: error.message,
      };
    }
  }
}

// 创建单例实例
const initializationService = new InitializationService();

// 导出初始化函数
export const initializeApp = () => initializationService.initializeApp();

export { initializationService };
export default initializationService;