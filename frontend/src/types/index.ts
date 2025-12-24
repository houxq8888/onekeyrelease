// 任务相关类型
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  type: 'content_generation' | 'publish' | 'both';
  accountId: string;
  content?: Content;
  publishTime?: string;
  createdAt: string;
  updatedAt: string;
  progress?: number;
  errorMessage?: string;
}

// 内容相关类型
export interface Content {
  id: string;
  title: string;
  description: string;
  text: string;
  images: Image[];
  videos: Video[];
  tags: string[];
  style: 'casual' | 'professional' | 'creative';
  targetAudience: string;
  createdAt: string;
  updatedAt: string;
}

export interface Image {
  id: string;
  url: string;
  description: string;
  size: number;
  width: number;
  height: number;
}

export interface Video {
  id: string;
  url: string;
  description: string;
  duration: number;
  size: number;
}

// 账号相关类型
export interface Account {
  id: string;
  platform: 'xiaohongshu';
  username: string;
  nickname: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'error';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页类型
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 生成配置类型
export interface GenerationConfig {
  style: 'casual' | 'professional' | 'creative';
  tone: 'friendly' | 'formal' | 'humorous';
  length: 'short' | 'medium' | 'long';
  keywords: string[];
  targetAudience: string;
  includeHashtags: boolean;
  includeEmojis: boolean;
}

// 模板相关类型
export interface Template {
  _id: string;
  name: string;
  category: '美食' | '旅行' | '美妆' | '穿搭' | '家居' | '育儿' | '其他';
  titleStructure: string;
  contentFramework: string;
  tagSuggestions: string[];
  imageCountSuggestion: number;
  description: string;
  isPreset: boolean;
  isFavorite: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 发布配置类型
export interface PublishConfig {
  scheduleTime?: string;
  autoRetry: boolean;
  maxRetries: number;
  notifyOnComplete: boolean;
}