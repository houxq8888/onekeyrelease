import Account, { IAccount } from '../models/Account';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

export class AccountService {
  /**
   * 创建新账号
   */
  static async createAccount(accountData: Partial<IAccount>): Promise<IAccount> {
    try {
      // 验证账号信息
      const account = new Account(accountData);
      (account as any).validateCredentials();

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
    } catch (error: any) {
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
  static async getUserAccounts(
    userId: string, 
    page: number = 1, 
    limit: number = 10,
    platform?: string,
    status?: string
  ) {
    try {
      const query: any = { createdBy: userId };
      
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
    } catch (error: any) {
      logger.error(`获取账号列表失败: ${error.message}`);
      throw new AppError(`获取账号列表失败: ${error.message}`, 500);
    }
  }

  /**
   * 获取账号详情
   */
  static async getAccountById(accountId: string, userId: string): Promise<IAccount> {
    try {
      const account = await Account.findOne({ _id: accountId, createdBy: userId })
        .select('-password -cookies');
      
      if (!account) {
        throw new AppError('账号不存在', 404);
      }

      return account;
    } catch (error: any) {
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
  static async updateAccount(
    accountId: string, 
    userId: string, 
    updateData: Partial<IAccount>
  ): Promise<IAccount> {
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
    } catch (error: any) {
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
  static async deleteAccount(accountId: string, userId: string): Promise<void> {
    try {
      const account = await Account.findOne({ _id: accountId, createdBy: userId });
      
      if (!account) {
        throw new AppError('账号不存在', 404);
      }

      await Account.deleteOne({ _id: accountId });
      
      logger.info(`账号删除成功: ${accountId}`);
    } catch (error: any) {
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
  static async testAccount(accountId: string, userId: string): Promise<IAccount> {
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
        await (account as any).updateStatus('active');
        logger.info(`账号测试成功: ${account.username}`);
      } else {
        await (account as any).updateStatus('error', '登录失败：账号或密码错误');
        logger.warn(`账号测试失败: ${account.username}`);
        throw new AppError('登录失败：账号或密码错误', 400);
      }

      return account;
    } catch (error: any) {
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
  static async getAccountStats(userId: string) {
    try {
      const stats = await (Account as any).getStatsByPlatform(userId);
      
      const totalAccounts = (stats as Array<{total: number, active: number, error: number}>).reduce((sum, stat) => sum + stat.total, 0);
      const activeAccounts = (stats as Array<{total: number, active: number, error: number}>).reduce((sum, stat) => sum + stat.active, 0);
      const errorAccounts = stats.reduce((sum: number, stat: any) => sum + stat.error, 0);

      return {
        platforms: stats,
        total: totalAccounts,
        active: activeAccounts,
        error: errorAccounts,
        activeRate: totalAccounts > 0 ? Math.round((activeAccounts / totalAccounts) * 100) : 0,
      };
    } catch (error: any) {
      logger.error(`获取账号统计失败: ${error.message}`);
      throw new AppError(`获取账号统计失败: ${error.message}`, 500);
    }
  }

  /**
   * 批量测试账号
   */
  static async batchTestAccounts(accountIds: string[], userId: string) {
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
        } catch (error: any) {
          results.push({
            accountId,
            success: false,
            message: error.message,
          });
        }
      }

      return results;
    } catch (error: any) {
      logger.error(`批量测试账号失败: ${error.message}`);
      throw new AppError(`批量测试账号失败: ${error.message}`, 500);
    }
  }
}