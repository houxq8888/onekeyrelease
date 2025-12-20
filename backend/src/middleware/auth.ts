import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: any;
}

/**
 * JWT认证中间件
 */
export const authMiddleware = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
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
  } catch (error) {
    next(error);
  }
};

/**
 * 管理员权限中间件
 */
export const adminMiddleware = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError('请先登录', 401);
    }

    if (req.user.role !== 'admin') {
      throw new AppError('权限不足，需要管理员权限', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 可选认证中间件（不强制要求登录）
 */
export const optionalAuthMiddleware = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const user = await AuthService.verifyToken(token);
        req.user = user;
      } catch (error) {
        // token无效，但不阻止请求继续
        console.warn('可选认证中间件：token验证失败', error);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};