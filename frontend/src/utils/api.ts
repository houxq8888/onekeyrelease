import axios from 'axios';
import type { ApiResponse } from '../types';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 辅助函数：从存储中获取token（用于拦截器，避免在非React组件环境中使用hooks）
const getTokenFromStorage = (): string | null => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed.state?.token || null;
    }
  } catch (error) {
    console.error('Failed to get token from storage:', error);
  }
  return null;
};

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    try {
      // 确保headers对象存在
      if (!config.headers) {
        config.headers = {} as any;
      }
      
      // 添加认证token
      const token = getTokenFromStorage();
      if (token && typeof token === 'string' && token.trim() !== '') {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('请求拦截器处理token时出错:', error);
      // 继续处理请求，不中断
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    try {
      // 处理认证错误
      if (error?.response?.status === 401) {
        localStorage.removeItem('auth-storage');
        // 仅在当前页面不是登录页时才刷新页面
        if (!window.location.pathname.includes('/auth')) {
          window.location.reload();
        }
      }
    } catch (interceptorError) {
      console.warn('响应拦截器处理错误时出错:', interceptorError);
      // 继续处理，不中断错误传递
    }
    
    return Promise.reject(error);
  }
);

// API方法封装
export const apiClient = {
  // 任务相关
  tasks: {
    list: (params?: any) => api.get<ApiResponse>('/tasks', { params }),
    create: (data: any) => api.post<ApiResponse>('/tasks', data),
    get: (id: string) => api.get<ApiResponse>(`/tasks/${id}`),
    update: (id: string, data: any) => api.put<ApiResponse>(`/tasks/${id}`, data),
    delete: (id: string) => api.delete<ApiResponse>(`/tasks/${id}`),
    start: (id: string) => api.post<ApiResponse>(`/tasks/${id}/start`),
    stop: (id: string) => api.post<ApiResponse>(`/tasks/${id}/stop`),
  },
  
  // 内容相关
  content: {
    generate: (data: any) => api.post<ApiResponse>('/content/generate', data),
    generateImages: (data: any) => api.post<ApiResponse>('/content/generate/images', data),
    generateVideo: (data: any) => api.post<ApiResponse>('/content/generate/video', data),
    optimize: (data: any) => api.post<ApiResponse>('/content/optimize', data),
    batchGenerate: (data: any) => api.post<ApiResponse>('/content/batch/generate', data),
    manual: (data: any) => api.post<ApiResponse>('/content/manual', data),
    list: (params?: any) => api.get<ApiResponse>('/content', { params }),
    get: (id: string) => api.get<ApiResponse>(`/content/${id}`),
    update: (id: string, data: any) => api.put<ApiResponse>(`/content/${id}`, data),
    delete: (id: string) => api.delete<ApiResponse>(`/content/${id}`),
    publish: (data: any) => api.post<ApiResponse>('/content/publish', data),
    saveImages: (id: string, data: any) => api.post<ApiResponse>(`/content/${id}/images`, data),
    getPlatforms: () => api.get<ApiResponse>('/content/platforms'),
    getStyles: () => api.get<ApiResponse>('/content/styles'),
  },
  
  // 账号相关
  accounts: {
    list: () => api.get<ApiResponse>('/accounts'),
    create: (data: any) => api.post<ApiResponse>('/accounts', data),
    update: (id: string, data: any) => api.put<ApiResponse>(`/accounts/${id}`, data),
    delete: (id: string) => api.delete<ApiResponse>(`/accounts/${id}`),
    test: (id: string) => api.post<ApiResponse>(`/accounts/${id}/test`),
  },
  
  // 认证相关
  auth: {
    login: (data: any) => api.post<ApiResponse>('/auth/login', data),
    register: (data: any) => api.post<ApiResponse>('/auth/register', data),
    logout: () => api.post<ApiResponse>('/auth/logout'),
    profile: () => api.get<ApiResponse>('/auth/me'),
  },

  // 移动端相关
  mobile: {
    // 获取移动端API信息
    info: () => api.get<ApiResponse>('/mobile'),
    
    // 设备管理
    devices: {
      list: () => api.get<ApiResponse>('/mobile/devices'),
      register: (data: any) => api.post<ApiResponse>('/mobile/device/register', data),
      status: (deviceId: string) => api.get<ApiResponse>(`/mobile/device/status/${deviceId}`),
    },
    
    // 指令管理
    commands: {
      send: (data: any) => api.post<ApiResponse>('/mobile/command', data),
      status: (taskId: string) => api.get<ApiResponse>(`/mobile/status/${taskId}`),
    },
    
    // 内容管理
    content: {
      list: (deviceId: string, params?: any) => api.get<ApiResponse>(`/mobile/content/${deviceId}`, { params }),
      download: (contentId: string) => api.get<ApiResponse>(`/mobile/content/download/${contentId}`),
    },
  },
};

export default api;