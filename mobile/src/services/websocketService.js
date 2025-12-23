import { store } from '../store/store';
import { setWebSocketStatus } from '../store/slices/deviceSlice';
import { updateTaskStatus, addTask } from '../store/slices/taskSlice';
import { addContent } from '../store/slices/contentSlice';
import { addNotification } from '../store/slices/notificationSlice';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.deviceId = null;
    this.reconnectInterval = 5000; // 5秒重连间隔
    this.maxReconnectAttempts = 10; // 最大重连次数
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  // 连接WebSocket
  connect(deviceId) {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.deviceId = deviceId;
    this.isConnecting = true;

    try {
      // WebSocket服务器地址
      const wsUrl = `ws://localhost:3000/ws?deviceId=${deviceId}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket连接成功');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        store.dispatch(setWebSocketStatus(true));
        
        // 发送连接确认消息
        this.send({
          type: 'connection_confirm',
          deviceId: this.deviceId,
          timestamp: new Date().toISOString(),
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('WebSocket消息解析失败:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket连接关闭:', event.code, event.reason);
        this.isConnecting = false;
        store.dispatch(setWebSocketStatus(false));
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket连接错误:', error);
        this.isConnecting = false;
        store.dispatch(setWebSocketStatus(false));
      };

    } catch (error) {
      console.error('WebSocket连接失败:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  // 处理重连
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        this.connect(this.deviceId);
      }, this.reconnectInterval);
    } else {
      console.error('达到最大重连次数，停止重连');
    }
  }

  // 发送消息
  send(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      return true;
    }
    console.warn('WebSocket未连接，无法发送消息');
    return false;
  }

  // 处理接收到的消息
  handleMessage(message) {
    const { type, data } = message;

    switch (type) {
      case 'task_status_update':
        store.dispatch(updateTaskStatus(data));
        break;
        
      case 'task_created':
        store.dispatch(addTask(data));
        break;
        
      case 'content_ready':
        store.dispatch(addContent(data));
        
        // 发送内容就绪通知
        store.dispatch(addNotification({
          type: 'content_ready',
          title: '内容生成完成',
          message: `任务"${data.title}"的内容已生成完成`,
          data: { contentId: data.contentId },
        }));
        break;
        
      case 'task_completed':
        store.dispatch(updateTaskStatus({
          taskId: data.taskId,
          status: 'completed',
          progress: 100,
        }));
        
        store.dispatch(addNotification({
          type: 'task_completed',
          title: '任务完成',
          message: `任务"${data.title}"已完成`,
          data: { taskId: data.taskId },
        }));
        break;
        
      case 'task_failed':
        store.dispatch(updateTaskStatus({
          taskId: data.taskId,
          status: 'failed',
          error: data.error,
        }));
        
        store.dispatch(addNotification({
          type: 'task_failed',
          title: '任务失败',
          message: `任务"${data.title}"执行失败: ${data.error}`,
          data: { taskId: data.taskId },
        }));
        break;
        
      case 'system_notification':
        store.dispatch(addNotification({
          type: 'system',
          title: data.title,
          message: data.message,
          data: data.data,
        }));
        break;
        
      default:
        console.log('未知消息类型:', type, data);
    }
  }

  // 断开连接
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, '用户主动断开');
      this.ws = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    store.dispatch(setWebSocketStatus(false));
  }

  // 获取连接状态
  getConnectionStatus() {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }

  // 发送心跳包
  sendHeartbeat() {
    if (this.getConnectionStatus() === 'connected') {
      this.send({
        type: 'heartbeat',
        deviceId: this.deviceId,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

export const webSocketService = new WebSocketService();
export { WebSocketService };