import mongoose from 'mongoose';
import Task, { ITask } from '../models/Task';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { memoryStorage, isMongoDBConnected } from '../config/database.js';
import { EmailService } from './emailService.js';
import { WebSocketService } from './websocketService.js';

export class TaskService {
  /**
   * 创建新任务
   */
  static async createTask(taskData: Partial<ITask>): Promise<ITask> {
    try {
      // 检查是否使用内存数据库模式
      if (!isMongoDBConnected()) {
        // 内存数据库模式：创建任务
        const newTask = {
          _id: `task-${Date.now()}`,
          title: taskData.title || '未命名任务',
          type: taskData.type || 'content_generation',
          status: 'pending',
          progress: 0,
          createdBy: taskData.createdBy || 'unknown',
          createdAt: new Date(),
          updatedAt: new Date(),
          result: {},
          ...taskData
        };
        
        memoryStorage.addTask(newTask);
        
        logger.info(`任务创建成功（内存模式）: ${newTask._id} - ${newTask.title}`);
        return newTask as ITask;
      }

      // 正常MongoDB操作
      // 检查是否为演示用户ID
      const isDemoUser = taskData.createdBy === 'demo-user-id';
      const task = new Task({
        ...taskData,
        createdBy: isDemoUser ? taskData.createdBy : new mongoose.Types.ObjectId(taskData.createdBy as string),
      });
      await task.save();
      
      logger.info(`任务创建成功: ${task._id} - ${task.title}`);
      
      // 如果配置了邮件提醒，发送提醒邮件
      if (task.notificationConfig && task.notificationConfig.enabled && task.notificationConfig.emailList && task.notificationConfig.emailList.length > 0) {
        if (task.config.publishConfig && task.config.publishConfig.scheduleTime) {
          const publishTime = new Date(task.config.publishConfig.scheduleTime);
          const remindBeforeDays = task.notificationConfig.remindBeforeDays || 1;
          const remindTime = new Date(publishTime.getTime() - remindBeforeDays * 24 * 60 * 60 * 1000);
          
          // 只在提醒时间还没到时才发送
          if (remindTime > new Date()) {
            await EmailService.sendTaskReminder(
              task.title,
              publishTime,
              task.notificationConfig.emailList
            );
            logger.info(`任务提醒邮件已发送: ${task._id} -> ${task.notificationConfig.emailList.join(', ')}`);
          }
        }
      }
      
      return task;
    } catch (error: any) {
      logger.error(`任务创建失败: ${error.message}`);
      throw new AppError(`创建任务失败: ${error.message}`, 400);
    }
  }

  /**
   * 获取用户任务列表
   */
  static async getUserTasks(userId: string, page: number = 1, pageSize: number = 10, sort: string = '-createdAt', status?: string): Promise<{ tasks: ITask[]; total: number; page: number; pageSize: number }> {
    try {
      // 检查是否使用内存数据库模式
      if (!isMongoDBConnected()) {
        // 内存数据库模式：获取用户任务
        let tasks = memoryStorage.findTasksByUserId(userId);
        
        // 根据状态过滤任务
        if (status) {
          tasks = tasks.filter((task: any) => task.status === status);
        }
        
        // 排序
        if (sort.startsWith('-')) {
          const field = sort.substring(1);
          tasks.sort((a: any, b: any) => {
            if (a[field] < b[field]) return 1;
            if (a[field] > b[field]) return -1;
            return 0;
          });
        } else {
          tasks.sort((a: any, b: any) => {
            if (a[sort] < b[sort]) return -1;
            if (a[sort] > b[sort]) return 1;
            return 0;
          });
        }
        
        const total = tasks.length;
        const skip = (page - 1) * pageSize;
        const paginatedTasks = tasks.slice(skip, skip + pageSize);
        
        logger.info(`获取用户任务列表成功（内存模式）: ${userId}, 总数: ${total}`);
        return {
          tasks: paginatedTasks as ITask[],
          total,
          page,
          pageSize
        };
      }

      // 正常MongoDB模式 - 检查是否为演示用户
      const skip = (page - 1) * pageSize;
      const sortObj: any = {};
      
      if (sort.startsWith('-')) {
        sortObj[sort.substring(1)] = -1;
      } else {
        sortObj[sort] = 1;
      }

      // 检查是否为演示用户ID
      const isDemoUser = userId === 'demo-user-id';
      const queryCondition: any = isDemoUser ? { createdBy: userId } : { createdBy: new mongoose.Types.ObjectId(userId) };

      // 根据状态过滤任务
      if (status) {
        queryCondition.status = status;
      }

      const tasks = await Task.find(queryCondition)
        .sort(sortObj)
        .skip(skip)
        .limit(pageSize)
        .populate('createdBy', 'username');

      const total = await Task.countDocuments(queryCondition);
      
      logger.info(`获取用户任务列表成功: ${userId}, 总数: ${total}`);
      return {
        tasks,
        total,
        page,
        pageSize
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`获取用户任务列表失败: ${error.message}`);
      throw new AppError(`获取用户任务列表失败: ${error.message}`, 500);
    }
  }

  /**
   * 获取任务详情
   */
  static async getTaskById(taskId: string, userId: string): Promise<ITask> {
    try {
      // 检查是否使用内存数据库模式
      if (!isMongoDBConnected()) {
        // 内存数据库模式：获取任务详情
        const task = memoryStorage.findTaskById(taskId);
        
        if (!task || task.createdBy !== userId) {
          throw new AppError('任务不存在', 404);
        }
        
        logger.info(`获取任务详情成功（内存模式）: ${taskId}`);
        return task as ITask;
      }

      // 正常MongoDB模式 - 检查是否为演示用户
      const isDemoUser = userId === 'demo-user-id';
      const queryCondition = isDemoUser ? { _id: taskId, createdBy: userId } : { _id: taskId, createdBy: new mongoose.Types.ObjectId(userId) };
      
      const task = await Task.findOne(queryCondition).populate('createdBy', 'username');
      
      if (!task) {
        throw new AppError('任务不存在', 404);
      }
      
      logger.info(`获取任务详情成功: ${taskId}`);
      return task;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`获取任务详情失败: ${error.message}`);
      throw new AppError(`获取任务详情失败: ${error.message}`, 500);
    }
  }

  /**
   * 更新任务进度
   */
  static async updateTaskProgress(
    taskId: string, 
    userId: string, 
    progress: number,
    status?: ITask['status'],
    step?: string,
    stepProgress?: number,
    stepData?: any
  ): Promise<ITask> {
    try {
      // 检查是否使用内存数据库模式
      if (!isMongoDBConnected()) {
        // 内存数据库模式：更新任务进度
        const task = memoryStorage.findTaskById(taskId);
        
        if (!task || task.createdBy !== userId) {
          throw new AppError('任务不存在', 404);
        }

        task.progress = Math.min(Math.max(progress, 0), 100);
        if (status) {
          task.status = status;
        }
        
        // 更新执行上下文
        if (step || stepProgress || stepData) {
          task.executionContext = {
            ...task.executionContext,
            currentStep: step || task.executionContext?.currentStep,
            stepProgress: stepProgress !== undefined ? stepProgress : task.executionContext?.stepProgress,
            stepData: stepData || task.executionContext?.stepData
          };
        }
        
        if (progress >= 100) {
          task.status = 'completed';
          task.completedAt = new Date();
        }

        // 更新内存中的任务
        memoryStorage.updateTask(taskId, task);
        
        // 发送实时进度更新
        WebSocketService.broadcast({
          type: 'progress_update',
          data: {
            taskId,
            progress: task.progress,
            status: task.status,
            executionContext: task.executionContext
          },
          timestamp: Date.now()
        });
        
        logger.info(`任务进度更新（内存模式）: ${taskId} - ${task.progress}% - ${task.status}`);
        return task as ITask;
      }

      // 正常MongoDB模式 - 检查是否为演示用户
      const isDemoUser = userId === 'demo-user-id';
      const queryCondition = isDemoUser ? { _id: taskId, createdBy: userId } : { _id: taskId, createdBy: new mongoose.Types.ObjectId(userId) };
      
      const task = await Task.findOne(queryCondition);
      
      if (!task) {
        throw new AppError('任务不存在', 404);
      }

      task.progress = Math.min(Math.max(progress, 0), 100);
      if (status) {
        task.status = status;
      }
      
      // 更新执行上下文
      if (step || stepProgress || stepData) {
        task.executionContext = {
          ...task.executionContext,
          currentStep: step || task.executionContext?.currentStep,
          stepProgress: stepProgress !== undefined ? stepProgress : task.executionContext?.stepProgress,
          stepData: stepData || task.executionContext?.stepData
        };
      }
      
      if (progress >= 100) {
        task.status = 'completed';
        task.completedAt = new Date();
      }

      await task.save();
      
      // 发送实时进度更新
      WebSocketService.broadcast({
        type: 'progress_update',
        data: {
          taskId,
          progress: task.progress,
          status: task.status,
          executionContext: task.executionContext
        },
        timestamp: Date.now()
      });
      
      logger.info(`任务进度更新: ${taskId} - ${task.progress}% - ${task.status}`);
      return task;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`更新任务进度失败: ${error.message}`);
      throw new AppError(`更新任务进度失败: ${error.message}`, 500);
    }
  }

  /**
   * 更新任务结果
   */
  static async updateTaskResult(
    taskId: string, 
    userId: string, 
    result: Partial<ITask['result']>
  ): Promise<ITask> {
    try {
      // 检查是否使用内存数据库模式
      if (!isMongoDBConnected()) {
        // 内存数据库模式：更新任务结果
        const task = memoryStorage.findTaskById(taskId);
        
        if (!task || task.createdBy !== userId) {
          throw new AppError('任务不存在', 404);
        }

        task.result = { ...task.result, ...result };
        
        if (result && result.error) {
          task.status = 'failed';
          task.completedAt = new Date();
        }

        // 更新内存中的任务
        memoryStorage.updateTask(taskId, task);
        
        logger.info(`任务结果更新（内存模式）: ${taskId}`);
        return task as ITask;
      }

      // 正常MongoDB模式 - 检查是否为演示用户
      const isDemoUser = userId === 'demo-user-id';
      const queryCondition = isDemoUser ? { _id: taskId, createdBy: userId } : { _id: taskId, createdBy: new mongoose.Types.ObjectId(userId) };
      
      const task = await Task.findOne(queryCondition);
      
      if (!task) {
        throw new AppError('任务不存在', 404);
      }

      task.result = { ...task.result, ...result };
      
      if (result && result.error) {
        task.status = 'failed';
        task.completedAt = new Date();
      }

      await task.save();
      
      logger.info(`任务结果更新: ${taskId}`);
      return task;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`更新任务结果失败: ${error.message}`);
      throw new AppError(`更新任务结果失败: ${error.message}`, 500);
    }
  }

  /**
   * 删除任务
   */
  static async deleteTask(taskId: string, userId: string): Promise<void> {
    try {
      // 检查是否使用内存数据库模式
      if (!isMongoDBConnected()) {
        // 内存数据库模式：删除任务
        const task = memoryStorage.findTaskById(taskId);
        
        if (!task || task.createdBy !== userId) {
          throw new AppError('任务不存在', 404);
        }

        if (task.status === 'running') {
          throw new AppError('运行中的任务无法删除', 400);
        }

        // 从内存中删除任务
        memoryStorage.deleteTask(taskId);
        
        logger.info(`任务删除成功（内存模式）: ${taskId}`);
        return;
      }

      // 正常MongoDB模式 - 检查是否为演示用户
      const isDemoUser = userId === 'demo-user-id';
      const queryCondition = isDemoUser ? { _id: taskId, createdBy: userId } : { _id: taskId, createdBy: new mongoose.Types.ObjectId(userId) };
      
      const task = await Task.findOne(queryCondition);
      
      if (!task) {
        throw new AppError('任务不存在', 404);
      }

      if (task.status === 'running') {
        throw new AppError('运行中的任务无法删除', 400);
      }

      await Task.deleteOne({ _id: taskId });
      
      logger.info(`任务删除成功: ${taskId}`);
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`删除任务失败: ${error.message}`);
      throw new AppError(`删除任务失败: ${error.message}`, 500);
    }
  }

  /**
   * 暂停任务
   */
  static async pauseTask(taskId: string, userId: string): Promise<ITask> {
    try {
      // 检查是否使用内存数据库模式
      if (!isMongoDBConnected()) {
        // 内存数据库模式：暂停任务
        const task = memoryStorage.findTaskById(taskId);
        
        if (!task || task.createdBy !== userId) {
          throw new AppError('任务不存在', 404);
        }

        if (task.status !== 'running') {
          throw new AppError('只有运行中的任务才能暂停', 400);
        }

        task.status = 'paused';
        task.pausedAt = new Date();

        // 更新内存中的任务
        memoryStorage.updateTask(taskId, task);
        
        // 发送任务暂停通知
        WebSocketService.broadcast({
          type: 'task_status_response',
          data: {
            taskId,
            status: 'paused',
            message: '任务已暂停'
          },
          timestamp: Date.now()
        });
        
        // 添加日志
        this.addTaskLog(taskId, userId, 'info', '任务已暂停');
        
        logger.info(`任务暂停成功（内存模式）: ${taskId}`);
        return task as ITask;
      }

      // 正常MongoDB模式
      const task = await Task.findOne({
        _id: taskId,
        createdBy: userId === 'demo-user-id' ? userId : new mongoose.Types.ObjectId(userId)
      });
      
      if (!task) {
        throw new AppError('任务不存在', 404);
      }

      if (task.status !== 'running') {
        throw new AppError('只有运行中的任务才能暂停', 400);
      }

      task.status = 'paused';
      task.pausedAt = new Date();
      await task.save();
      
      // 发送任务暂停通知
      WebSocketService.broadcast({
        type: 'task_status_response',
        data: {
          taskId,
          status: 'paused',
          message: '任务已暂停'
        },
        timestamp: Date.now()
      });
      
      // 添加日志
      this.addTaskLog(taskId, userId, 'info', '任务已暂停');
      
      logger.info(`任务暂停成功: ${taskId}`);
      return task;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`暂停任务失败: ${error.message}`);
      throw new AppError(`暂停任务失败: ${error.message}`, 500);
    }
  }

  /**
   * 恢复任务
   */
  static async resumeTask(taskId: string, userId: string): Promise<ITask> {
    try {
      // 检查是否使用内存数据库模式
      if (!isMongoDBConnected()) {
        // 内存数据库模式：恢复任务
        const task = memoryStorage.findTaskById(taskId);
        
        if (!task || task.createdBy !== userId) {
          throw new AppError('任务不存在', 404);
        }

        if (task.status !== 'paused') {
          throw new AppError('只有暂停的任务才能恢复', 400);
        }

        task.status = 'running';
        task.resumedAt = new Date();

        // 更新内存中的任务
        memoryStorage.updateTask(taskId, task);
        
        // 发送任务恢复通知
        WebSocketService.broadcast({
          type: 'task_status_response',
          data: {
            taskId,
            status: 'running',
            message: '任务已恢复',
            progress: task.progress
          },
          timestamp: Date.now()
        });
        
        // 添加日志
        this.addTaskLog(taskId, userId, 'info', '任务已恢复');
        
        logger.info(`任务恢复成功（内存模式）: ${taskId}`);
        return task as ITask;
      }

      // 正常MongoDB模式
      const task = await Task.findOne({
        _id: taskId,
        createdBy: userId === 'demo-user-id' ? userId : new mongoose.Types.ObjectId(userId)
      });
      
      if (!task) {
        throw new AppError('任务不存在', 404);
      }

      if (task.status !== 'paused') {
        throw new AppError('只有暂停的任务才能恢复', 400);
      }

      task.status = 'running';
      task.resumedAt = new Date();
      await task.save();
      
      // 发送任务恢复通知
      WebSocketService.broadcast({
        type: 'task_status_response',
        data: {
          taskId,
          status: 'running',
          message: '任务已恢复',
          progress: task.progress
        },
        timestamp: Date.now()
      });
      
      // 添加日志
      this.addTaskLog(taskId, userId, 'info', '任务已恢复');
      
      logger.info(`任务恢复成功: ${taskId}`);
      return task;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`恢复任务失败: ${error.message}`);
      throw new AppError(`恢复任务失败: ${error.message}`, 500);
    }
  }

  /**
   * 取消任务
   */
  static async cancelTask(taskId: string, userId: string): Promise<ITask> {
    try {
      // 检查是否使用内存数据库模式
      if (!isMongoDBConnected()) {
        // 内存数据库模式：取消任务
        const task = memoryStorage.findTaskById(taskId);
        
        if (!task || task.createdBy !== userId) {
          throw new AppError('任务不存在', 404);
        }

        if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
          throw new AppError('已完成、失败或已取消的任务不能重复取消', 400);
        }

        task.status = 'cancelled';
        task.completedAt = new Date();

        // 更新内存中的任务
        memoryStorage.updateTask(taskId, task);
        
        // 发送任务取消通知
        WebSocketService.broadcast({
          type: 'task_status_response',
          data: {
            taskId,
            status: 'cancelled',
            message: '任务已取消'
          },
          timestamp: Date.now()
        });
        
        // 添加日志
        this.addTaskLog(taskId, userId, 'warning', '任务已取消');
        
        logger.info(`任务取消成功（内存模式）: ${taskId}`);
        return task as ITask;
      }

      // 正常MongoDB模式
      const task = await Task.findOne({
        _id: taskId,
        createdBy: userId === 'demo-user-id' ? userId : new mongoose.Types.ObjectId(userId)
      });
      
      if (!task) {
        throw new AppError('任务不存在', 404);
      }

      if (task.status === 'completed' || task.status === 'failed' || task.status === 'cancelled') {
        throw new AppError('已完成、失败或已取消的任务不能重复取消', 400);
      }

      task.status = 'cancelled';
      task.completedAt = new Date();
      await task.save();
      
      // 发送任务取消通知
      WebSocketService.broadcast({
        type: 'task_status_response',
        data: {
          taskId,
          status: 'cancelled',
          message: '任务已取消'
        },
        timestamp: Date.now()
      });
      
      // 添加日志
      this.addTaskLog(taskId, userId, 'warning', '任务已取消');
      
      logger.info(`任务取消成功: ${taskId}`);
      return task;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`取消任务失败: ${error.message}`);
      throw new AppError(`取消任务失败: ${error.message}`, 500);
    }
  }

  /**
   * 添加任务日志
   */
  static async addTaskLog(
    taskId: string,
    userId: string,
    level: 'info' | 'warning' | 'error' | 'debug',
    message: string,
    details?: any
  ): Promise<void> {
    try {
      // 检查是否使用内存数据库模式
      if (!isMongoDBConnected()) {
        // 内存数据库模式：添加日志
        const task = memoryStorage.findTaskById(taskId);
        
        if (!task || task.createdBy !== userId) {
          throw new AppError('任务不存在', 404);
        }

        const logEntry = {
          timestamp: new Date(),
          level,
          message,
          details
        };

        if (!task.logs) {
          task.logs = [];
        }
        
        task.logs.push(logEntry);

        // 更新内存中的任务
        memoryStorage.updateTask(taskId, task);
        
        logger.debug(`任务日志添加成功（内存模式）: ${taskId} - ${message}`);
        return;
      }

      // 正常MongoDB模式
      const task = await Task.findOne({
        _id: taskId,
        createdBy: userId === 'demo-user-id' ? userId : new mongoose.Types.ObjectId(userId)
      });
      
      if (!task) {
        throw new AppError('任务不存在', 404);
      }

      await Task.updateOne(
        { _id: taskId },
        { $push: {
            logs: {
              timestamp: new Date(),
              level,
              message,
              details
            }
          }
        }
      );
      
      logger.debug(`任务日志添加成功: ${taskId} - ${message}`);
    } catch (error: any) {
      logger.error(`添加任务日志失败: ${error.message}`);
      // 不抛出错误，避免影响主流程
    }
  }

  /**
   * 获取任务日志
   */
  static async getTaskLogs(taskId: string, userId: string, limit: number = 100): Promise<ITask['logs']> {
    try {
      // 检查是否使用内存数据库模式
      if (!isMongoDBConnected()) {
        // 内存数据库模式：获取任务日志
        const task = memoryStorage.findTaskById(taskId);
        
        if (!task || task.createdBy !== userId) {
          throw new AppError('任务不存在', 404);
        }

        logger.info(`获取任务日志成功（内存模式）: ${taskId}`);
        return task.logs || [];
      }

      // 正常MongoDB模式
      const task = await Task.findOne({
        _id: taskId,
        createdBy: userId === 'demo-user-id' ? userId : new mongoose.Types.ObjectId(userId)
      }, { logs: { $slice: limit } });
      
      if (!task) {
        throw new AppError('任务不存在', 404);
      }

      logger.info(`获取任务日志成功: ${taskId}`);
      return task.logs || [];
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`获取任务日志失败: ${error.message}`);
      throw new AppError(`获取任务日志失败: ${error.message}`, 500);
    }
  }

  /**
   * 获取任务统计信息
   */
  static async getTaskStats(userId: string) {
    try {
      // 检查是否使用内存数据库模式
      if (!isMongoDBConnected()) {
        // 内存数据库模式：获取任务统计
        const tasks = memoryStorage.findTasksByUserId(userId);
        
        const stats: Record<string, number> = {
          pending: 0,
          running: 0,
          completed: 0,
          failed: 0,
          paused: 0,
          cancelled: 0
        };
        
        tasks.forEach((task: any) => {
          if (task.status in stats) {
            stats[task.status]++;
          }
        });
        
        const totalTasks = tasks.length;
        const completedTasks = stats.completed || 0;
        const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

        logger.info(`获取任务统计成功（内存模式）: ${userId}, 总数: ${totalTasks}`);
        return {
          ...stats,
          total: totalTasks,
          successRate: Math.round(successRate),
        };
      }

      // 正常MongoDB模式
      const stats = await (Task as any).getStatsByStatus(userId);
      
      const totalTasks = Object.values(stats as Record<string, number>).reduce((sum: number, count: number) => sum + count, 0);
      const completedTasks = (stats as Record<string, number>).completed || 0;
      const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      return {
        ...stats,
        total: totalTasks,
        successRate: Math.round(successRate),
      };
    } catch (error: any) {
      logger.error(`获取任务统计失败: ${error.message}`);
      throw new AppError(`获取任务统计失败: ${error.message}`, 500);
    }
  }

  /**
   * 启动任务
   */
  static async startTask(taskId: string, userId: string): Promise<ITask> {
    try {
      // 检查是否使用内存数据库模式
      if (!isMongoDBConnected()) {
        // 内存数据库模式：启动任务
        const task = memoryStorage.findTaskById(taskId);
        
        if (!task || task.createdBy !== userId) {
          throw new AppError('任务不存在', 404);
        }

        if (task.status === 'running') {
          throw new AppError('任务已在运行中', 400);
        }

        if (task.status === 'completed' || task.status === 'failed') {
          throw new AppError('已完成或失败的任务无法重新启动', 400);
        }

        task.status = 'running';
        task.startedAt = new Date();
        
        // 更新内存中的任务
        memoryStorage.updateTask(taskId, task);
        
        logger.info(`任务启动成功（内存模式）: ${taskId}`);
        return task as ITask;
      }

      // 正常MongoDB模式
      const task = await Task.findOne({ _id: taskId, createdBy: userId });
      
      if (!task) {
        throw new AppError('任务不存在', 404);
      }

      if (task.status === 'running') {
        throw new AppError('任务已在运行中', 400);
      }

      if (task.status === 'completed' || task.status === 'failed') {
        throw new AppError('已完成或失败的任务无法重新启动', 400);
      }

      task.status = 'running';
      task.startedAt = new Date();
      await task.save();
      
      logger.info(`任务启动成功: ${taskId}`);
      return task;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`启动任务失败: ${error.message}`);
      throw new AppError(`启动任务失败: ${error.message}`, 500);
    }
  }
}