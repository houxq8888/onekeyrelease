import Redis from 'redis';
import { logger } from '../utils/logger.js';
let redisClient;
export async function connectRedis() {
    try {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
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
        logger.error('Failed to connect to Redis:', error);
        throw error;
    }
}
export function getRedisClient() {
    if (!redisClient) {
        throw new Error('Redis client not initialized');
    }
    return redisClient;
}
export async function disconnectRedis() {
    if (redisClient) {
        await redisClient.quit();
        logger.info('Redis disconnected');
    }
}
