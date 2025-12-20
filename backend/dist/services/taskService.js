import Task from '../models/Task';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
export class TaskService {
    /**
     * 创建新任务
     */
    static async createTask(taskData) {
        try {
            const task = new Task(taskData);
            await task.save();
            logger.info(`任务创建成功: ${task._id} - ${task.title}`);
            return task;
        }
        catch (error) {
            logger.error(`任务创建失败: ${error.message}`);
            throw new AppError(`创建任务失败: ${error.message}`, 400);
        }
    }
    /**
     * 获取用户任务列表
     */
    static async getUserTasks(userId, page = 1, limit = 10, status, type) {
        try {
            const query = { createdBy: userId };
            if (status) {
                query.status = status;
            }
            if (type) {
                query.type = type;
            }
            const tasks = await Task.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate('createdBy', 'username');
            const total = await Task.countDocuments(query);
            return {
                tasks,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        }
        catch (error) {
            logger.error(`获取任务列表失败: ${error.message}`);
            throw new AppError(`获取任务列表失败: ${error.message}`, 500);
        }
    }
    /**
     * 获取任务详情
     */
    static async getTaskById(taskId, userId) {
        try {
            const task = await Task.findOne({ _id: taskId, createdBy: userId })
                .populate('createdBy', 'username');
            if (!task) {
                throw new AppError('任务不存在', 404);
            }
            return task;
        }
        catch (error) {
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
    static async updateTaskProgress(taskId, userId, progress, status) {
        try {
            const task = await Task.findOne({ _id: taskId, createdBy: userId });
            if (!task) {
                throw new AppError('任务不存在', 404);
            }
            if (progress < 0 || progress > 100) {
                throw new AppError('进度值必须在0-100之间', 400);
            }
            task.progress = progress;
            if (status) {
                task.status = status;
            }
            if (progress === 0 && !task.startedAt) {
                task.startedAt = new Date();
            }
            if (progress === 100 && !task.completedAt) {
                task.completedAt = new Date();
            }
            await task.save();
            logger.info(`任务进度更新: ${taskId} - ${progress}%`);
            return task;
        }
        catch (error) {
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
    static async updateTaskResult(taskId, userId, result) {
        try {
            const task = await Task.findOne({ _id: taskId, createdBy: userId });
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
        }
        catch (error) {
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
    static async deleteTask(taskId, userId) {
        try {
            const task = await Task.findOne({ _id: taskId, createdBy: userId });
            if (!task) {
                throw new AppError('任务不存在', 404);
            }
            if (task.status === 'running') {
                throw new AppError('运行中的任务无法删除', 400);
            }
            await Task.deleteOne({ _id: taskId });
            logger.info(`任务删除成功: ${taskId}`);
        }
        catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error(`删除任务失败: ${error.message}`);
            throw new AppError(`删除任务失败: ${error.message}`, 500);
        }
    }
    /**
     * 获取任务统计信息
     */
    static async getTaskStats(userId) {
        try {
            const stats = await Task.getStatsByStatus(userId);
            const totalTasks = Object.values(stats).reduce((sum, count) => sum + count, 0);
            const completedTasks = stats.completed || 0;
            const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
            return {
                ...stats,
                total: totalTasks,
                successRate: Math.round(successRate),
            };
        }
        catch (error) {
            logger.error(`获取任务统计失败: ${error.message}`);
            throw new AppError(`获取任务统计失败: ${error.message}`, 500);
        }
    }
    /**
     * 启动任务
     */
    static async startTask(taskId, userId) {
        try {
            const task = await Task.findOne({ _id: taskId, createdBy: userId });
            if (!task) {
                throw new AppError('任务不存在', 404);
            }
            if (task.status !== 'pending') {
                throw new AppError('只有待处理的任务可以启动', 400);
            }
            task.status = 'running';
            task.startedAt = new Date();
            task.progress = 0;
            await task.save();
            logger.info(`任务启动成功: ${taskId}`);
            return task;
        }
        catch (error) {
            if (error instanceof AppError) {
                throw error;
            }
            logger.error(`启动任务失败: ${error.message}`);
            throw new AppError(`启动任务失败: ${error.message}`, 500);
        }
    }
}
