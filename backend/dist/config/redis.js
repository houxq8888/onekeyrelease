import Redis from 'redis';
import { logger } from '../utils/logger.js';
let redisClient;
// 内存缓存模拟
const memoryCache = new Map();
// 模拟Redis操作
const mockRedis = {
    set: async (key, value, options) => {
        memoryCache.set(key, value);
        if (options?.EX) {
            setTimeout(() => memoryCache.delete(key), options.EX * 1000);
        }
        return 'OK';
    },
    get: async (key) => memoryCache.get(key) || null,
    del: async (key) => {
        const existed = memoryCache.has(key);
        memoryCache.delete(key);
        return existed ? 1 : 0;
    },
    exists: async (key) => memoryCache.has(key) ? 1 : 0,
    expire: async (key, seconds) => {
        if (memoryCache.has(key)) {
            setTimeout(() => memoryCache.delete(key), seconds * 1000);
            return 1;
        }
        return 0;
    }
};
export async function connectRedis() {
    try {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        // 尝试连接真实Redis
        redisClient = Redis.createClient({
            url: redisUrl,
            socket: {
                reconnectStrategy: (retries) => Math.min(retries * 50, 2000)
            }
        });
        redisClient.on('error', (error) => {
            logger.error('Redis connection error:', error);
        });
        redisClient.on('connect', () => {
            logger.info('Redis connected successfully');
        });
        // 设置连接超时，避免无限等待
        const connectPromise = redisClient.connect();
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Redis connection timeout')), 5000);
        });
        await Promise.race([connectPromise, timeoutPromise]);
    }
    catch (error) {
        // 如果Redis连接失败，使用内存缓存
        logger.warn('Redis连接失败，使用内存缓存模式:', error.message);
        redisClient = mockRedis;
        logger.info('内存缓存模式已启用');
    }
}
export function getRedisClient() {
    if (!redisClient) {
        throw new Error('Redis client not initialized');
    }
    return redisClient;
}
export async function disconnectRedis() {
    if (redisClient && redisClient !== mockRedis) {
        await redisClient.quit();
        logger.info('Redis disconnected');
    }
}
export const isRedisConnected = () => redisClient && redisClient !== mockRedis;
