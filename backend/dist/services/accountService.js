import Account from '../models/Account';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { memoryStorage, isMongoDBConnected } from '../config/database.js';
export class AccountService {
    /**
     * 创建新账号
     */
    static async createAccount(accountData) {
        try {
            // 检查是否使用内存数据库模式
            if (!isMongoDBConnected()) {
                // 内存数据库模式：创建账号
                // 检查用户名是否已存在
                const existingAccounts = memoryStorage.findAccountsByUserId(accountData.createdBy || '');
                const existingAccount = existingAccounts.find((a) => a.username === accountData.username && a.platform === accountData.platform);
                if (existingAccount) {
                    throw new AppError('该平台下已存在相同用户名的账号', 400);
                }
                // 创建账号对象
                const account = {
                    _id: `account-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    ...accountData,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    status: 'active'
                };
                // 添加到内存存储
                memoryStorage.addAccount(account);
                logger.info(`账号创建成功（内存模式）: ${account._id} - ${account.username}`);
                return account;
            }
            // 正常MongoDB模式
            // 验证账号信息
            const account = new Account(accountData);
            account.validateCredentials();
            // 检查用户名是否已存在
            const existingAccount = await Account.findOne({
                username: accountData.username,
                platform: accountData.platform
            });
            if (existingAccount) {
                throw new AppError('该平台下已存在相同用户名的账号', 400);
            }
            await account.save();
            logger.info(`账号创建成功: ${account._id} - ${account.username}`);
            return account;
        }
        catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error(`账号创建失败: ${error.message}`);
            throw new AppError(`创建账号失败: ${error.message}`, 400);
        }
    }
    /**
     * 获取用户账号列表
     */
    static async getUserAccounts(userId, page = 1, limit = 10, platform, status) {
        try {
            // 检查是否使用内存数据库模式
            if (!isMongoDBConnected()) {
                // 内存数据库模式：获取用户账号列表
                let accounts = memoryStorage.findAccountsByUserId(userId);
                // 过滤条件
                if (platform) {
                    accounts = accounts.filter((a) => a.platform === platform);
                }
                if (status) {
                    accounts = accounts.filter((a) => a.status === status);
                }
                // 排序
                accounts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                const total = accounts.length;
                const skip = (page - 1) * limit;
                const paginatedAccounts = accounts.slice(skip, skip + limit);
                // 移除敏感信息
                const safeAccounts = paginatedAccounts.map((account) => {
                    const { password, cookies, ...safeAccount } = account;
                    return safeAccount;
                });
                logger.info(`获取账号列表成功（内存模式）: ${userId}, 总数: ${total}`);
                return {
                    accounts: safeAccounts,
                    pagination: {
                        page,
                        limit,
                        total,
                        pages: Math.ceil(total / limit),
                    },
                };
            }
            // 正常MongoDB模式
            const query = { createdBy: userId };
            if (platform) {
                query.platform = platform;
            }
            if (status) {
                query.status = status;
            }
            const accounts = await Account.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .select('-password -cookies'); // 不返回敏感信息
            const total = await Account.countDocuments(query);
            return {
                accounts,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            logger.error(`获取账号列表失败: ${error.message}`);
            throw new AppError(`获取账号列表失败: ${error.message}`, 500);
        }
    }
    /**
     * 获取账号详情
     */
    static async getAccountById(accountId, userId) {
        try {
            // 检查是否使用内存数据库模式
            if (!isMongoDBConnected()) {
                // 内存数据库模式：获取账号详情
                const account = memoryStorage.findAccountById(accountId);
                if (!account || account.createdBy !== userId) {
                    throw new AppError('账号不存在', 404);
                }
                // 移除敏感信息
                const { password, cookies, ...safeAccount } = account;
                logger.info(`获取账号详情成功（内存模式）: ${accountId}`);
                return safeAccount;
            }
            // 正常MongoDB模式
            const account = await Account.findOne({ _id: accountId, createdBy: userId })
                .select('-password -cookies');
            if (!account) {
                throw new AppError('账号不存在', 404);
            }
            return account;
        }
        catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error(`获取账号详情失败: ${error.message}`);
            throw new AppError(`获取账号详情失败: ${error.message}`, 500);
        }
    }
    /**
     * 更新账号信息
     */
    static async updateAccount(accountId, userId, updateData) {
        try {
            const account = await Account.findOne({ _id: accountId, createdBy: userId });
            if (!account) {
                throw new AppError('账号不存在', 404);
            }
            // 不允许修改平台和用户名
            if (updateData.platform || updateData.username) {
                throw new AppError('平台和用户名不能修改', 400);
            }
            Object.assign(account, updateData);
            await account.save();
            logger.info(`账号更新成功: ${accountId}`);
            return account;
        }
        catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error(`更新账号失败: ${error.message}`);
            throw new AppError(`更新账号失败: ${error.message}`, 500);
        }
    }
    /**
     * 删除账号
     */
    static async deleteAccount(accountId, userId) {
        try {
            const account = await Account.findOne({ _id: accountId, createdBy: userId });
            if (!account) {
                throw new AppError('账号不存在', 404);
            }
            await Account.deleteOne({ _id: accountId });
            logger.info(`账号删除成功: ${accountId}`);
        }
        catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error(`删除账号失败: ${error.message}`);
            throw new AppError(`删除账号失败: ${error.message}`, 500);
        }
    }
    /**
     * 测试账号登录
     */
    static async testAccount(accountId, userId) {
        try {
            const account = await Account.findOne({ _id: accountId, createdBy: userId });
            if (!account) {
                throw new AppError('账号不存在', 404);
            }
            // 模拟小红书登录测试
            logger.info(`开始测试账号登录: ${account.username}`);
            // 这里应该调用实际的小红书登录API
            // 暂时模拟登录过程
            await new Promise(resolve => setTimeout(resolve, 2000));
            // 模拟登录成功
            const loginSuccess = Math.random() > 0.2; // 80%成功率
            if (loginSuccess) {
                await account.updateStatus('active');
                logger.info(`账号测试成功: ${account.username}`);
            }
            else {
                await account.updateStatus('error', '登录失败：账号或密码错误');
                logger.warn(`账号测试失败: ${account.username}`);
                throw new AppError('登录失败：账号或密码错误', 400);
            }
            return account;
        }
        catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error(`测试账号失败: ${error.message}`);
            throw new AppError(`测试账号失败: ${error.message}`, 500);
        }
    }
    /**
     * 获取账号统计信息
     */
    static async getAccountStats(userId) {
        try {
            const stats = await Account.getStatsByPlatform(userId);
            const totalAccounts = stats.reduce((sum, stat) => sum + stat.total, 0);
            const activeAccounts = stats.reduce((sum, stat) => sum + stat.active, 0);
            const errorAccounts = stats.reduce((sum, stat) => sum + stat.error, 0);
            return {
                platforms: stats,
                total: totalAccounts,
                active: activeAccounts,
                error: errorAccounts,
                activeRate: totalAccounts > 0 ? Math.round((activeAccounts / totalAccounts) * 100) : 0,
            };
        }
        catch (error) {
            logger.error(`获取账号统计失败: ${error.message}`);
            throw new AppError(`获取账号统计失败: ${error.message}`, 500);
        }
    }
    /**
     * 批量测试账号
     */
    static async batchTestAccounts(accountIds, userId) {
        try {
            const results = [];
            for (const accountId of accountIds) {
                try {
                    const account = await this.testAccount(accountId, userId);
                    results.push({
                        accountId,
                        success: true,
                        message: '测试成功',
                        account,
                    });
                }
                catch (error) {
                    results.push({
                        accountId,
                        success: false,
                        message: error.message,
                    });
                }
            }
            return results;
        }
        catch (error) {
            logger.error(`批量测试账号失败: ${error.message}`);
            throw new AppError(`批量测试账号失败: ${error.message}`, 500);
        }
    }
}
