import { AuthService } from '../services/authService';
import { AppError } from './errorHandler.js';
/**
 * JWT认证中间件
 */
export const authMiddleware = async (req, _res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('访问被拒绝，请提供有效的token', 401);
        }
        const token = authHeader.substring(7); // 去掉 'Bearer ' 前缀
        if (!token) {
            throw new AppError('访问被拒绝，token无效', 401);
        }
        // 验证token
        const user = await AuthService.verifyToken(token);
        req.user = user;
        next();
    }
    catch (error) {
        next(error);
    }
};
/**
 * 管理员权限中间件
 */
export const adminMiddleware = async (req, _res, next) => {
    try {
        if (!req.user) {
            throw new AppError('请先登录', 401);
        }
        if (req.user.role !== 'admin') {
            throw new AppError('权限不足，需要管理员权限', 403);
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
/**
 * 可选认证中间件（不强制要求登录）
 */
export const optionalAuthMiddleware = async (req, _res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const user = await AuthService.verifyToken(token);
                req.user = user;
            }
            catch (error) {
                // token无效，但不阻止请求继续
                console.warn('可选认证中间件：token验证失败', error);
            }
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
/**
 * 演示认证中间件（用于演示版本，自动设置演示用户）
 */
export const demoAuthMiddleware = async (req, _res, next) => {
    try {
        const authHeader = req.header('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const user = await AuthService.verifyToken(token);
                req.user = user;
            }
            catch (error) {
                console.warn('演示认证中间件：token验证失败，使用默认演示用户', error);
                // token无效，使用演示用户
                req.user = {
                    _id: 'demo-user-id',
                    username: '演示用户',
                    email: 'demo@example.com',
                    role: 'admin'
                };
            }
        }
        else {
            // 没有token，使用演示用户
            req.user = {
                _id: 'demo-user-id',
                username: '演示用户',
                email: 'demo@example.com',
                role: 'admin'
            };
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
