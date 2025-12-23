import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { store } from '../store/store';
import { setPermissionGranted } from '../store/slices/notificationSlice';

// 配置通知处理程序
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.isInitialized = false;
  }

  // 初始化通知服务
  async init() {
    if (this.isInitialized) return;

    try {
      // 配置通知渠道（Android）
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: '默认通知',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      // 监听通知点击事件
      Notifications.addNotificationResponseReceivedListener((response) => {
        this.handleNotificationResponse(response);
      });

      // 监听前台通知
      Notifications.addNotificationReceivedListener((notification) => {
        this.handleNotificationReceived(notification);
      });

      this.isInitialized = true;
      console.log('通知服务初始化完成');
    } catch (error) {
      console.error('通知服务初始化失败:', error);
    }
  }

  // 请求通知权限
  async requestPermissions() {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const granted = finalStatus === 'granted';
      store.dispatch(setPermissionGranted(granted));

      if (!granted) {
        console.warn('通知权限未授予');
      }

      return granted;
    } catch (error) {
      console.error('请求通知权限失败:', error);
      return false;
    }
  }

  // 发送本地通知
  async sendLocalNotification(title, body, data = {}) {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('没有通知权限，无法发送通知');
        return false;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null, // 立即触发
      });

      return true;
    } catch (error) {
      console.error('发送本地通知失败:', error);
      return false;
    }
  }

  // 发送任务状态通知
  async sendTaskNotification(taskData) {
    const { status, title, taskId } = taskData;
    
    let notificationTitle = '';
    let notificationBody = '';

    switch (status) {
      case 'completed':
        notificationTitle = '任务完成';
        notificationBody = `任务"${title}"已完成`;
        break;
      case 'failed':
        notificationTitle = '任务失败';
        notificationBody = `任务"${title}"执行失败`;
        break;
      case 'processing':
        notificationTitle = '任务进行中';
        notificationBody = `任务"${title}"正在处理中`;
        break;
      default:
        return false;
    }

    return await this.sendLocalNotification(
      notificationTitle,
      notificationBody,
      { type: 'task_update', taskId, status }
    );
  }

  // 发送内容就绪通知
  async sendContentReadyNotification(contentData) {
    const { title, contentId } = contentData;
    
    return await this.sendLocalNotification(
      '内容生成完成',
      `任务"${title}"的内容已生成完成`,
      { type: 'content_ready', contentId }
    );
  }

  // 发送系统通知
  async sendSystemNotification(title, message, data = {}) {
    return await this.sendLocalNotification(
      title,
      message,
      { type: 'system', ...data }
    );
  }

  // 处理通知响应
  handleNotificationResponse(response) {
    const { notification, actionIdentifier } = response;
    const { data } = notification.request.content;

    console.log('通知被点击:', actionIdentifier, data);

    // 根据通知类型处理不同的点击行为
    switch (data.type) {
      case 'task_update':
        // 跳转到任务详情页
        this.navigateToTaskDetail(data.taskId);
        break;
      case 'content_ready':
        // 跳转到内容详情页
        this.navigateToContentDetail(data.contentId);
        break;
      default:
        // 默认处理
        break;
    }
  }

  // 处理前台通知
  handleNotificationReceived(notification) {
    console.log('前台收到通知:', notification);
    // 可以在这里处理前台通知的显示逻辑
  }

  // 跳转到任务详情页
  navigateToTaskDetail(taskId) {
    // 这里需要实现导航逻辑
    console.log('跳转到任务详情:', taskId);
  }

  // 跳转到内容详情页
  navigateToContentDetail(contentId) {
    // 这里需要实现导航逻辑
    console.log('跳转到内容详情:', contentId);
  }

  // 取消所有预定通知
  async cancelAllScheduledNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return true;
    } catch (error) {
      console.error('取消所有预定通知失败:', error);
      return false;
    }
  }

  // 获取未读通知数量
  async getBadgeCount() {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('获取徽章数量失败:', error);
      return 0;
    }
  }

  // 设置徽章数量
  async setBadgeCount(count) {
    try {
      await Notifications.setBadgeCountAsync(count);
      return true;
    } catch (error) {
      console.error('设置徽章数量失败:', error);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
export { NotificationService };