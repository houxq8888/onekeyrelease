import mongoose from 'mongoose';
import Task from '../models/Task';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { memoryStorage, isMongoDBConnected } from '../config/database.js';
export class TaskService {
    /**
     * 创建新任务
     */
    static async createTask(taskData) {
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
                return newTask;
            }
            // 正常MongoDB操作
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
    static async getUserTasks(userId, page = 1, pageSize = 10, sort = '-createdAt') {
        try {
            // 检查是否使用内存数据库模式
            if (!isMongoDBConnected()) {
                // 内存数据库模式：获取用户任务
                let tasks = memoryStorage.findTasksByUserId(userId);
                // 排序
                if (sort.startsWith('-')) {
                    const field = sort.substring(1);
                    tasks.sort((a, b) => {
                        if (a[field] < b[field])
                            return 1;
                        if (a[field] > b[field])
                            return -1;
                        return 0;
                    });
                }
                else {
                    tasks.sort((a, b) => {
                        if (a[sort] < b[sort])
                            return -1;
                        if (a[sort] > b[sort])
                            return 1;
                        return 0;
                    });
                }
                const total = tasks.length;
                const skip = (page - 1) * pageSize;
                const paginatedTasks = tasks.slice(skip, skip + pageSize);
                logger.info(`获取用户任务列表成功（内存模式）: ${userId}, 总数: ${total}`);
                return {
                    tasks: paginatedTasks,
                    total,
                    page,
                    pageSize
                };
            }
            // 正常MongoDB模式 - 检查是否为演示用户
            const skip = (page - 1) * pageSize;
            const sortObj = {};
            if (sort.startsWith('-')) {
                sortObj[sort.substring(1)] = -1;
            }
            else {
                sortObj[sort] = 1;
            }
            // 检查是否为演示用户ID
            const isDemoUser = userId === 'demo-user-id';
            const queryCondition = isDemoUser ? { createdBy: userId } : { createdBy: new mongoose.Types.ObjectId(userId) };
            const tasks = await Task.find(queryCondition)
                .sort(sortObj)
                .skip(skip)
                .limit(pageSize);
            const total = await Task.countDocuments(queryCondition);
            logger.info(`获取用户任务列表成功: ${userId}, 总数: ${total}`);
            return {
                tasks,
                total,
                page,
                pageSize
            };
        }
        catch (error) {
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
    static async getTaskById(taskId, userId) {
        try {
            // 检查是否使用内存数据库模式
            if (!isMongoDBConnected()) {
                // 内存数据库模式：获取任务详情
                const task = memoryStorage.findTaskById(taskId);
                if (!task || task.createdBy !== userId) {
                    throw new AppError('任务不存在', 404);
                }
                logger.info(`获取任务详情成功（内存模式）: ${taskId}`);
                return task;
            }
            // 正常MongoDB模式 - 检查是否为演示用户
            const isDemoUser = userId === 'demo-user-id';
            const queryCondition = isDemoUser ? { _id: taskId, createdBy: userId } : { _id: taskId, createdBy: new mongoose.Types.ObjectId(userId) };
            const task = await Task.findOne(queryCondition);
            if (!task) {
                throw new AppError('任务不存在', 404);
            }
            logger.info(`获取任务详情成功: ${taskId}`);
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
            // 检查是否使用内存数据库模式
            if (!isMongoDBConnected()) {
                // 内存数据库模式：更新任务进度
                const task = memoryStorage.findTaskById(taskId);
                if (!task || task.createdBy !== userId) {
                    throw new AppError('任务不存在', 404);
                }
                task.progress = progress;
                if (status) {
                    task.status = status;
                }
                if (progress >= 100) {
                    task.status = 'completed';
                    task.completedAt = new Date();
                }
                // 更新内存中的任务
                memoryStorage.updateTask(taskId, task);
                logger.info(`任务进度更新（内存模式）: ${taskId} - ${progress}%`);
                return task;
            }
            // 正常MongoDB模式 - 检查是否为演示用户
            const isDemoUser = userId === 'demo-user-id';
            const queryCondition = isDemoUser ? { _id: taskId, createdBy: userId } : { _id: taskId, createdBy: new mongoose.Types.ObjectId(userId) };
            const task = await Task.findOne(queryCondition);
            if (!task) {
                throw new AppError('任务不存在', 404);
            }
            task.progress = progress;
            if (status) {
                task.status = status;
            }
            if (progress >= 100) {
                task.status = 'completed';
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
                return task;
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
            // 检查是否使用内存数据库模式
            if (!isMongoDBConnected()) {
                // 内存数据库模式：获取任务统计
                const tasks = memoryStorage.findTasksByUserId(userId);
                const stats = {
                    pending: 0,
                    running: 0,
                    completed: 0,
                    failed: 0
                };
                tasks.forEach((task) => {
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
                return task;
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
