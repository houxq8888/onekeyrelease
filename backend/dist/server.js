import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import { connectRedis } from './config/redis.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import apiRoutes from './api/index.js';
import { AuthService } from './services/authService.js';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
// 中间件配置
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
// CORS配置
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
// 速率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制每个IP 15分钟内最多100次请求
    message: {
        success: false,
        error: '请求过于频繁，请稍后再试'
    }
});
app.use(limiter);
// 解析JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// 请求日志
app.use((req, _res, next) => {
    logger.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
});
// 健康检查端点
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});
// API路由
app.use('/api', apiRoutes);
// 错误处理中间件
app.use(errorHandler);
// 404处理
app.use('*', (_req, res) => {
    res.status(404).json({
        success: false,
        error: '接口不存在',
    });
});
// 启动服务器
async function startServer() {
    try {
        // 连接数据库
        await connectDB();
        logger.info('✅ MongoDB connected successfully');
        // 连接Redis
        await connectRedis();
        logger.info('✅ Redis connected successfully');
        // 创建默认管理员账号（开发环境）
        if (process.env.NODE_ENV === 'development') {
            await AuthService.createDefaultAdmin();
        }
        app.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT}`);
            logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
            logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
        });
    }
    catch (error) {
        logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// 优雅关闭
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    process.exit(0);
});
startServer();
