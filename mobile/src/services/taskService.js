import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/v1';

class TaskService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 15000,
    });
  }

  // 发送指令
  async sendCommand(commandData) {
    try {
      const response = await this.api.post('/mobile/command/send', commandData);
      return response;
    } catch (error) {
      console.error('发送指令失败:', error);
      throw error;
    }
  }

  // 查询任务状态
  async getTaskStatus(taskId) {
    try {
      const response = await this.api.get(`/mobile/task/status/${taskId}`);
      return response;
    } catch (error) {
      console.error('查询任务状态失败:', error);
      throw error;
    }
  }

  // 获取任务列表
  async getTaskList(deviceId) {
    try {
      const response = await this.api.get(`/mobile/task/list/${deviceId}`);
      return response;
    } catch (error) {
      console.error('获取任务列表失败:', error);
      throw error;
    }
  }

  // 取消任务
  async cancelTask(taskId) {
    try {
      const response = await this.api.post('/mobile/task/cancel', { taskId });
      return response;
    } catch (error) {
      console.error('取消任务失败:', error);
      throw error;
    }
  }

  // 重新执行任务
  async retryTask(taskId) {
    try {
      const response = await this.api.post('/mobile/task/retry', { taskId });
      return response;
    } catch (error) {
      console.error('重新执行任务失败:', error);
      throw error;
    }
  }

  // 获取任务统计
  async getTaskStats(deviceId) {
    try {
      const response = await this.api.get(`/mobile/task/stats/${deviceId}`);
      return response;
    } catch (error) {
      console.error('获取任务统计失败:', error);
      throw error;
    }
  }

  // 取消任务
  static async cancelTask(taskId) {
    try {
      const response = await axios.post(`${this.baseURL}/tasks/${taskId}/cancel`);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // 重新执行任务
  static async retryTask(taskId) {
    try {
      const response = await axios.post(`${this.baseURL}/tasks/${taskId}/retry`);
      return response;
    } catch (error) {
      throw error;
    }
  }
}

export const taskService = new TaskService();
export { TaskService };