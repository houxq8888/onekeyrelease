import axios from 'axios';
import { message } from 'antd';
import { ApiResponse } from '@types';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
    const errorMessage = error.response?.data?.error || error.message || '请求失败';
    
    // 显示错误消息
    if (error.response?.status !== 401) {
      message.error(errorMessage);
    }
    
    // 处理认证错误
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
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
    list: (params?: any) => api.get<ApiResponse>('/content', { params }),
    get: (id: string) => api.get<ApiResponse>(`/content/${id}`),
    update: (id: string, data: any) => api.put<ApiResponse>(`/content/${id}`, data),
    delete: (id: string) => api.delete<ApiResponse>(`/content/${id}`),
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
};

export default api;