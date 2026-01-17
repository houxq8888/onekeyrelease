import { Router } from 'express';
import taskRoutes from './routes/tasks.js';
import contentRoutes from './routes/content.js';
import accountRoutes from './routes/accounts.js';
import authRoutes from './routes/auth.js';
import templateRoutes from './routes/templates.js';
import mobileRoutes from './mobile.js';
import { asyncHandler } from '../middleware/errorHandler.js';
const router = Router();
// 各功能模块路由
router.use('/tasks', taskRoutes);
router.use('/content', contentRoutes);
router.use('/accounts', accountRoutes);
router.use('/auth', authRoutes);
router.use('/templates', templateRoutes);
router.use('/mobile', mobileRoutes);
// API信息端点
router.get('/', asyncHandler(async (_req, res) => {
    return res.json({
        message: 'OneKeyRelease API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            tasks: '/api/v1/tasks',
            content: '/api/v1/content',
            accounts: '/api/v1/accounts',
            auth: '/api/v1/auth',
            templates: '/api/v1/templates',
            mobile: '/api/v1/mobile'
        }
    });
}));
export default router;
