import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
// 内存数据库模拟
const memoryData = {
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
export async function connectDB() {
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
    }
    catch (error) {
        // 如果MongoDB连接失败，使用内存数据库
        logger.warn('MongoDB连接失败，使用内存数据库模式:', error.message);
        initializeMemoryStorage();
        logger.info('内存数据库模式已启用，可正常使用图文一键发布功能');
    }
}
export async function disconnectDB() {
    try {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            logger.info('MongoDB disconnected');
        }
    }
    catch (error) {
        logger.error('Error disconnecting from MongoDB:', error);
    }
}
export const isMongoDBConnected = () => mongoose.connection.readyState === 1;
// 内存数据库操作函数
export const memoryStorage = {
    getUsers: () => memoryData.users,
    addUser: (user) => memoryData.users.push(user),
    findUserById: (id) => memoryData.users.find((u) => u._id === id),
    findUserByEmail: (email) => memoryData.users.find((u) => u.email === email),
    getTasks: () => memoryData.tasks,
    addTask: (task) => memoryData.tasks.push(task),
    findTaskById: (id) => memoryData.tasks.find((t) => t._id === id),
    findTasksByUserId: (userId) => memoryData.tasks.filter((t) => t.createdBy === userId),
    updateTask: (id, updatedTask) => {
        const index = memoryData.tasks.findIndex((t) => t._id === id);
        if (index !== -1) {
            memoryData.tasks[index] = { ...memoryData.tasks[index], ...updatedTask };
        }
    },
    deleteTask: (id) => {
        const index = memoryData.tasks.findIndex((t) => t._id === id);
        if (index !== -1) {
            memoryData.tasks.splice(index, 1);
        }
    },
    getAccounts: () => memoryData.accounts,
    addAccount: (account) => memoryData.accounts.push(account),
    findAccountById: (id) => memoryData.accounts.find((a) => a._id === id),
    findAccountsByUserId: (userId) => memoryData.accounts.filter((a) => a.userId === userId),
    // 内容相关操作
    getContents: () => memoryData.content,
    addContent: (content) => memoryData.content.push(content),
    findContentById: (id) => memoryData.content.find((c) => c._id === id),
    findContentsByUserId: (userId) => memoryData.content.filter((c) => c.createdBy === userId),
    updateContent: (id, updatedContent) => {
        const index = memoryData.content.findIndex((c) => c._id === id);
        if (index !== -1) {
            memoryData.content[index] = { ...memoryData.content[index], ...updatedContent };
        }
    },
    deleteContent: (id) => {
        const index = memoryData.content.findIndex((c) => c._id === id);
        if (index !== -1) {
            memoryData.content.splice(index, 1);
        }
    }
};
