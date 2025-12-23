import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

// 内存数据库模拟
const memoryData: any = {
  users: [],
  tasks: [],
  accounts: [],
  content: []
};

// 模拟用户数据（用于开发测试）
const mockUsers = [
  {
    _id: 'demo-user-1',
    username: 'demo',
    email: 'demo@example.com',
    password: '$2a$10$examplehash', // demo123
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// 初始化内存存储
function initializeMemoryStorage() {
  memoryData.users = [...mockUsers];
  memoryData.tasks = [];
  memoryData.accounts = [];
  memoryData.content = [];
  logger.info('内存数据库初始化完成');
}

export async function connectDB(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/onekeyrelease';
    
    // 尝试连接真实MongoDB
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    mongoose.connection.on('error', (error) => {
      logger.error('MongoDB connection error:', error);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      process.exit(0);
    });

    logger.info('Connected to MongoDB successfully');

  } catch (error) {
    // 如果MongoDB连接失败，使用内存数据库
    logger.warn('MongoDB连接失败，使用内存数据库模式:', (error as Error).message);
    initializeMemoryStorage();
    logger.info('内存数据库模式已启用，可正常使用图文一键发布功能');
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      logger.info('MongoDB disconnected');
    }
  } catch (error) {
    logger.error('Error disconnecting from MongoDB:', error);
  }
}

export const isMongoDBConnected = (): boolean => mongoose.connection.readyState === 1;

// 内存数据库操作函数
export const memoryStorage = {
  getUsers: () => memoryData.users,
  addUser: (user: any) => memoryData.users.push(user),
  findUserById: (id: string) => memoryData.users.find((u: any) => u._id === id),
  findUserByEmail: (email: string) => memoryData.users.find((u: any) => u.email === email),
  
  getTasks: () => memoryData.tasks,
  addTask: (task: any) => memoryData.tasks.push(task),
  findTaskById: (id: string) => memoryData.tasks.find((t: any) => t._id === id),
  findTasksByUserId: (userId: string) => memoryData.tasks.filter((t: any) => t.createdBy === userId),
  updateTask: (id: string, updatedTask: any) => {
    const index = memoryData.tasks.findIndex((t: any) => t._id === id);
    if (index !== -1) {
      memoryData.tasks[index] = { ...memoryData.tasks[index], ...updatedTask };
    }
  },
  deleteTask: (id: string) => {
    const index = memoryData.tasks.findIndex((t: any) => t._id === id);
    if (index !== -1) {
      memoryData.tasks.splice(index, 1);
    }
  },
  
  getAccounts: () => memoryData.accounts,
  addAccount: (account: any) => memoryData.accounts.push(account),
  findAccountById: (id: string) => memoryData.accounts.find((a: any) => a._id === id),
  findAccountsByUserId: (userId: string) => memoryData.accounts.filter((a: any) => a.userId === userId),
  
  // 内容相关操作
  getContents: () => memoryData.content,
  addContent: (content: any) => memoryData.content.push(content),
  findContentById: (id: string) => memoryData.content.find((c: any) => c._id === id),
  findContentsByUserId: (userId: string) => memoryData.content.filter((c: any) => c.createdBy === userId),
  updateContent: (id: string, updatedContent: any) => {
    const index = memoryData.content.findIndex((c: any) => c._id === id);
    if (index !== -1) {
      memoryData.content[index] = { ...memoryData.content[index], ...updatedContent };
    }
  },
  deleteContent: (id: string) => {
    const index = memoryData.content.findIndex((c: any) => c._id === id);
    if (index !== -1) {
      memoryData.content.splice(index, 1);
    }
  }
};