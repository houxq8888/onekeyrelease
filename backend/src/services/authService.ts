import User from '../models/User';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { memoryStorage, isMongoDBConnected } from '../config/database.js';

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
      // 检查是否使用内存数据库模式
      if (!isMongoDBConnected()) {
        // 内存数据库模式：检查用户名是否已存在
        const existingUser = memoryStorage.findUserByEmail(registerData.email || registerData.username + '@example.com');
        if (existingUser) {
          throw new AppError('用户名已存在', 400);
        }

        // 创建新用户（内存模式）
        const newUser = {
          _id: `user-${Date.now()}`,
          username: registerData.username,
          email: registerData.email || `${registerData.username}@example.com`,
          password: registerData.password, // 注意：实际项目中应该加密
          role: 'user',
          preferences: {},
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        memoryStorage.addUser(newUser);

        // 生成JWT token
        const token = this.generateToken(newUser._id);

        logger.info(`用户注册成功（内存模式）: ${newUser.username}`);

        return {
          user: {
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
            preferences: newUser.preferences,
          },
          token,
        };
      }

      // 正常MongoDB模式
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
      
      logger.error(`用户注册失败: ${error.message}`);
      throw new AppError(`注册失败: ${error.message}`, 400);
    }
  }

  /**
   * 用户登录
   */
  static async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      // 检查是否使用内存数据库模式
      if (!isMongoDBConnected()) {
        // 内存数据库模式：查找用户
        const users = memoryStorage.getUsers();
        const user = users.find((u: any) => u.username === loginData.username);
        
        if (!user) {
          // 如果没有找到用户，使用演示用户
        const demoUser = {
          _id: 'demo-user-id',
          username: loginData.username,
          email: `${loginData.username}@demo.onekeyrelease.com`,
          role: 'user',
          preferences: {},
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
          
          memoryStorage.addUser(demoUser);

          // 生成JWT token
          const token = this.generateToken(demoUser._id);

          logger.info(`用户登录成功（内存模式）: ${demoUser.username}`);

          return {
            user: {
              _id: demoUser._id,
              username: demoUser.username,
              email: demoUser.email,
              role: demoUser.role,
              preferences: demoUser.preferences,
            },
            token,
          };
        }

        // 检查用户是否被禁用
        if (!user.isActive) {
          throw new AppError('账号已被禁用，请联系管理员', 401);
        }

        // 验证密码（内存模式下简单验证）
        const isPasswordValid = user.password === loginData.password;
        if (!isPasswordValid) {
          throw new AppError('用户名或密码错误', 401);
        }

        // 生成JWT token
        const token = this.generateToken(user._id);

        logger.info(`用户登录成功（内存模式）: ${user.username}`);

        return {
          user: {
            _id: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            preferences: user.preferences,
          },
          token,
        };
      }

      // 正常MongoDB模式
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
      
      logger.error(`用户登录失败: ${error.message}`);
      throw new AppError(`登录失败: ${error.message}`, 500);
    }
  }

  /**
   * 验证JWT token
   */
  static async verifyToken(token: string): Promise<any> {
    try {
      // 检查是否是演示token
      if (token === 'demo-token') {
        // 演示模式：返回演示用户信息
        return {
          _id: 'demo-user-id',
          username: '演示用户',
          email: 'demo@example.com',
          role: 'admin',
          preferences: {},
        };
      }
      
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      
      // 检查是否使用内存数据库模式
      if (!isMongoDBConnected()) {
        // 内存数据库模式：查找用户
        const user = memoryStorage.findUserById(decoded.userId);
        if (!user) {
          throw new AppError('用户不存在', 401);
        }

        if (!user.isActive) {
          throw new AppError('账号已被禁用', 401);
        }

        return {
          _id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
          preferences: user.preferences,
        };
      }
      
      // 正常MongoDB模式：查找用户
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
      
      // 如果数据库操作失败，抛出错误
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


}