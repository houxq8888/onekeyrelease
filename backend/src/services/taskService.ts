import { logger } from '../utils/logger';
import Task, { ITask } from '../models/Task';

export interface ITaskInput {
  title: string;
  description?: string;
  type: 'content_generation' | 'content_publish' | 'batch';
  config: {
    contentConfig?: {
      theme: string;
      keywords: string[];
      targetAudience: string;
      style: 'formal' | 'casual' | 'professional' | 'creative';
      wordCount: number;
    };
    publishConfig?: {
      accountId: string;
      platform: 'xiaohongshu';
      scheduleTime?: Date;
      autoPublish: boolean;
    };
  };
}

export class TaskService {
  /**
   * 创建新任务
   */
  static async createTask(userId: string, taskData: ITaskInput): Promise<ITask> {
    try {
      logger.info('📋 开始创建新任务:', { userId, taskData });
      
      // 验证必填字段
      if (!taskData.title) {
        logger.error('❌ 任务标题不能为空');
        throw new Error('Task title is required');
      }
      
      if (!taskData.type) {
        logger.error('❌ 任务类型不能为空');
        throw new Error('Task type is required');
      }
      
      // 创建任务实例
      const task = new Task({
        ...taskData,
        createdBy: userId,
      });
      
      logger.debug('💾 保存任务到数据库:', task);
      const savedTask = await task.save();
      
      logger.info('✅ 任务创建成功:', { taskId: savedTask._id });
      return savedTask;
    } catch (error) {
      logger.error('❌ 任务创建失败:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        userId,
        taskData,
      });
      throw error;
    }
  }
  
  /**
   * 获取用户的所有任务
   */
  static async getTasks(userId: string): Promise<ITask[]> {
    logger.info('📥 获取用户任务列表:', { userId });
    const tasks = await Task.find({ createdBy: userId }).sort({ createdAt: -1 });
    logger.debug('📊 获取到任务数量:', { count: tasks.length });
    return tasks;
  }
  
  /**
   * 获取单个任务
   */
  static async getTaskById(userId: string, taskId: string): Promise<ITask | null> {
    logger.info('🔍 获取单个任务:', { userId, taskId });
    const task = await Task.findOne({ _id: taskId, createdBy: userId });
    if (!task) {
      logger.warn('⚠️ 任务不存在:', { taskId });
    }
    return task;
  }
  
  /**
   * 更新任务
   */
  static async updateTask(
    userId: string,
    taskId: string,
    taskData: Partial<ITaskInput>
  ): Promise<ITask | null> {
    logger.info('✏️ 更新任务:', { userId, taskId, taskData });
    
    const updatedTask = await Task.findOneAndUpdate(
      { _id: taskId, createdBy: userId },
      { ...taskData, updatedAt: new Date() },
      { new: true }
    );
    
    if (!updatedTask) {
      logger.warn('⚠️ 任务不存在或无权更新:', { taskId });
    }
    
    return updatedTask;
  }
  
  /**
   * 删除任务
   */
  static async deleteTask(userId: string, taskId: string): Promise<boolean> {
    logger.info('🗑️ 删除任务:', { userId, taskId });
    const result = await Task.findOneAndDelete({ _id: taskId, createdBy: userId });
    
    if (!result) {
      logger.warn('⚠️ 任务不存在或无权删除:', { taskId });
      return false;
    }
    
    logger.info('✅ 任务删除成功:', { taskId });
    return true;
  }
  
  /**
   * 开始任务
   */
  static async startTask(taskId: string, userId: string): Promise<ITask | null> {
    logger.info('▶️ 开始执行任务:', { taskId, userId });
    
    const task = await Task.findOneAndUpdate(
      { _id: taskId, createdBy: userId, status: 'pending' },
      { status: 'running', startedAt: new Date(), progress: 0 },
      { new: true }
    );
    
    if (!task) {
      logger.warn('⚠️ 无法开始任务：任务不存在或状态不正确', { taskId });
    }
    
    return task;
  }
  
  /**
   * 更新任务进度
   */
  static async updateTaskProgress(
    taskId: string,
    userId: string,
    progress: number,
    status?: string
  ): Promise<ITask | null> {
    logger.info('📈 更新任务进度:', { taskId, userId, progress, status });
    
    const updateData: any = { progress, updatedAt: new Date() };
    
    if (status) {
      updateData.status = status;
      if (status === 'completed' && !updateData.completedAt) {
        updateData.completedAt = new Date();
      }
    }
    
    const task = await Task.findOneAndUpdate(
      { _id: taskId, createdBy: userId },
      updateData,
      { new: true }
    );
    
    if (!task) {
      logger.warn('⚠️ 任务不存在或无权更新进度:', { taskId });
    }
    
    return task;
  }
  
  /**
   * 更新任务结果
   */
  static async updateTaskResult(
    taskId: string,
    userId: string,
    result: any
  ): Promise<ITask | null> {
    logger.info('📝 更新任务结果:', { taskId, userId, result });
    
    const task = await Task.findOneAndUpdate(
      { _id: taskId, createdBy: userId },
      { result, status: 'completed', completedAt: new Date(), progress: 100, updatedAt: new Date() },
      { new: true }
    );
    
    if (!task) {
      logger.warn('⚠️ 任务不存在或无权更新结果:', { taskId });
    }
    
    return task;
  }
  
  /**
   * 获取任务统计
   */
  static async getTaskStats(userId: string): Promise<Record<string, number>> {
    logger.info('📊 获取任务统计:', { userId });
    const stats = await Task.getStatsByStatus(userId);
    logger.debug('📈 任务统计结果:', stats);
    return stats;
  }
}