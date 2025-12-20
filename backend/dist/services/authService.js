import User from '../models/User';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
export class AuthService {
    static JWT_SECRET = process.env.JWT_SECRET || 'onekeyrelease-secret-key';
    static JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
    /**
     * 用户注册
     */
    static async register(registerData) {
        try {
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
            await user.updateLastLogin();
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
        }
        catch (error) {
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
    static async login(loginData) {
        try {
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
            await user.updateLastLogin();
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
        }
        catch (error) {
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
    static async verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.JWT_SECRET);
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
        }
        catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                throw new AppError('Token无效', 401);
            }
            if (error instanceof jwt.TokenExpiredError) {
                throw new AppError('Token已过期', 401);
            }
            throw error;
        }
    }
    /**
     * 刷新token
     */
    static async refreshToken(oldToken) {
        try {
            // 验证旧token
            const user = await this.verifyToken(oldToken);
            // 生成新token
            return this.generateToken(user._id);
        }
        catch (error) {
            throw new AppError('Token刷新失败', 401);
        }
    }
    /**
     * 修改密码
     */
    static async changePassword(userId, currentPassword, newPassword) {
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
        }
        catch (error) {
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
    static generateToken(userId) {
        return jwt.sign({
            userId,
            iat: Math.floor(Date.now() / 1000),
        }, this.JWT_SECRET, {
            expiresIn: this.JWT_EXPIRES_IN,
        });
    }
    /**
     * 创建默认管理员账号（开发环境使用）
     */
    static async createDefaultAdmin() {
        try {
            const adminExists = await User.findOne({ username: 'admin' });
            if (!adminExists) {
                await User.createAdmin('admin', 'admin123', 'admin@onekeyrelease.com');
                logger.info('默认管理员账号创建成功');
            }
        }
        catch (error) {
            logger.error('创建默认管理员账号失败:', error);
        }
    }
}
