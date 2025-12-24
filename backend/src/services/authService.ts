import User from '../models/User';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import mongoose from 'mongoose';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
}

export interface AuthResponse {
  user: {
    _id: string;
    username: string;
    email?: string;
    role: string;
    preferences: any;
  };
  token: string;
}

export class AuthService {
  private static JWT_SECRET = process.env.JWT_SECRET || 'onekeyrelease-secret-key';
  private static JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

  /**
   * 用户注册
   */
  static async register(registerData: RegisterRequest): Promise<AuthResponse> {
    try {
      // 检查是否启用演示模式
      const isDemoMode = process.env.DEMO_MODE === 'true';
      
      // 如果启用演示模式，直接进入演示登录
      if (isDemoMode) {
        logger.warn('演示模式已启用，跳过注册验证');
        return this.demoLogin({
          username: registerData.username,
          password: registerData.password
        });
      }
      
      // 检查数据库连接状态，如果连接失败则进入演示模式
      if (mongoose.connection.readyState !== 1) {
        logger.warn('数据库连接失败，注册操作降级到演示模式');
        return this.demoLogin({
          username: registerData.username,
          password: registerData.password
        });
      }

      // 检查用户名是否已存在
      const existingUser = await User.findOne({ username: registerData.username });
      if (existingUser) {
        throw new AppError('用户名已存在', 400);
      }

      // 检查邮箱是否已存在（如果提供了邮箱）
      if (registerData.email) {
        const existingEmail = await User.findOne({ email: registerData.email });
        if (existingEmail) {
          throw new AppError('邮箱已被注册', 400);
        }
      }

      // 创建新用户
      const user = new User(registerData);
      await user.save();

      // 生成JWT token
      const token = this.generateToken(user._id.toString());

      // 更新最后登录时间
      await (user as any).updateLastLogin();

      logger.info(`用户注册成功: ${user.username}`);

      return {
        user: {
          _id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
          preferences: user.preferences,
        },
        token,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      
      // 如果数据库操作失败，降级到演示模式
      if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
        logger.warn('数据库操作失败，注册操作降级到演示模式');
        return this.demoLogin({
          username: registerData.username,
          password: registerData.password
        });
      }
      
      logger.error(`用户注册失败: ${error.message}`);
      throw new AppError(`注册失败: ${error.message}`, 400);
    }
  }

  /**
   * 用户登录
   */
  static async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      // 检查是否启用演示模式
      const isDemoMode = process.env.DEMO_MODE === 'true';
      
      // 如果启用演示模式，直接进入演示登录
      if (isDemoMode) {
        logger.warn('演示模式已启用，跳过账号验证');
        return this.demoLogin(loginData);
      }
      
      // 检查数据库连接状态，如果连接失败则进入演示模式
      if (mongoose.connection.readyState !== 1) {
        logger.warn('数据库连接失败，进入演示模式');
        return this.demoLogin(loginData);
      }

      // 查找用户（包含密码）
      const user = await User.findByUsernameWithPassword(loginData.username);
      if (!user) {
        throw new AppError('用户名或密码错误', 401);
      }

      // 检查用户是否被禁用
      if (!user.isActive) {
        throw new AppError('账号已被禁用，请联系管理员', 401);
      }

      // 验证密码
      const isPasswordValid = await user.comparePassword(loginData.password);
      if (!isPasswordValid) {
        throw new AppError('用户名或密码错误', 401);
      }

      // 生成JWT token
      const token = this.generateToken(user._id.toString());

      // 更新最后登录时间
      await (user as any).updateLastLogin();

      logger.info(`用户登录成功: ${user.username}`);

      return {
        user: {
          _id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
          preferences: user.preferences,
        },
        token,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      
      // 如果数据库操作失败，降级到演示模式
      if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
        logger.warn('数据库操作失败，降级到演示模式');
        return this.demoLogin(loginData);
      }
      
      logger.error(`用户登录失败: ${error.message}`);
      throw new AppError(`登录失败: ${error.message}`, 500);
    }
  }

  /**
   * 验证JWT token
   */
  static async verifyToken(token: string): Promise<any> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      // 检查是否为演示模式用户
      if (decoded.userId && decoded.userId.startsWith('demo-')) {
        // 演示模式用户，直接返回虚拟用户信息
        return {
          _id: decoded.userId,
          username: 'demo-user',
          email: 'demo@onekeyrelease.com',
          role: 'user',
          preferences: {},
        };
      }

      // 检查数据库连接状态
      if (mongoose.connection.readyState !== 1) {
        throw new AppError('数据库连接失败，请重新登录', 401);
      }
      
      // 查找用户
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) {
        throw new AppError('用户不存在', 401);
      }

      if (!user.isActive) {
        throw new AppError('账号已被禁用', 401);
      }

      return {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        preferences: user.preferences,
      };
    } catch (error: any) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError('Token无效', 401);
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError('Token已过期', 401);
      }
      
      // 如果数据库操作失败，允许演示模式用户继续使用
      if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
        throw new AppError('数据库连接失败，请重新登录', 401);
      }
      
      throw error;
    }
  }

  /**
   * 刷新token
   */
  static async refreshToken(oldToken: string): Promise<string> {
    try {
      // 验证旧token
      const user = await this.verifyToken(oldToken);
      
      // 生成新token
      return this.generateToken(user._id);
    } catch (error: any) {
      throw new AppError('Token刷新失败', 401);
    }
  }

  /**
   * 修改密码
   */
  static async changePassword(
    userId: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<void> {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new AppError('用户不存在', 404);
      }

      // 验证当前密码
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new AppError('当前密码错误', 400);
      }

      // 更新密码
      user.password = newPassword;
      await user.save();

      logger.info(`用户密码修改成功: ${user.username}`);
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`修改密码失败: ${error.message}`);
      throw new AppError(`修改密码失败: ${error.message}`, 500);
    }
  }

  /**
   * 生成JWT token
   */
  private static generateToken(userId: string): string {
    return jwt.sign(
      { 
        userId,
        iat: Math.floor(Date.now() / 1000),
      },
      this.JWT_SECRET,
      { 
        expiresIn: this.JWT_EXPIRES_IN as unknown as number | undefined,
      }
    );
  }

  /**
   * 创建默认管理员账号（开发环境使用）
   */
  static async createDefaultAdmin(): Promise<void> {
    try {
      const adminExists = await User.findOne({ username: 'admin' });
      if (!adminExists) {
        await User.createAdmin('admin', 'admin123', 'admin@onekeyrelease.com');
        logger.info('默认管理员账号创建成功');
      }
    } catch (error: any) {
      logger.error('创建默认管理员账号失败:', error);
    }
  }

  /**
   * 演示模式登录（数据库不可用时）
   */
  private static demoLogin(loginData: LoginRequest): AuthResponse {
    // 在演示模式下，接受任意用户名和密码
    // 生成一个虚拟的用户ID
    const demoUserId = `demo-${Date.now()}`;
    
    // 生成JWT token
    const token = this.generateToken(demoUserId);

    logger.info(`演示模式登录成功: ${loginData.username}`);

    return {
      user: {
        _id: demoUserId,
        username: loginData.username,
        email: `${loginData.username}@demo.onekeyrelease.com`,
        role: 'user',
        preferences: {},
      },
      token,
    };
  }
}