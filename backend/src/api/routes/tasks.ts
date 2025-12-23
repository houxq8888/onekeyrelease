import express from 'express';
import { TaskService } from '../../services/taskService';
import { authMiddleware } from '../../middleware/auth';

const router = express.Router();

// 获取任务列表
router.get('/', authMiddleware, async (req, res, _next) => {
  try {
    const userId = (req as any).user._id;
    const { page = 1, limit = 10, status } = req.query;
    
    const result = await TaskService.getUserTasks(
      userId,
      parseInt(page as string),
      parseInt(limit as string),
      status as string
    );
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    return _next(error);
  }
});

// 获取任务详情
router.get('/:id', authMiddleware, async (req, res, _next) => {
  try {
    const userId = (req as any).user._id;
    const taskId = req.params.id;
    
    const task = await TaskService.getTaskById(taskId, userId);
    
    res.json({
      success: true,
      data: task,
    });
  } catch (error) {
    return _next(error);
  }
});

// 创建任务
router.post('/', authMiddleware, async (req, res, _next) => {
  try {
    const userId = (req as any).user._id;
    const taskData = {
      ...req.body,
      createdBy: userId,
    };
    
    const task = await TaskService.createTask(taskData);
    
    res.status(201).json({
      success: true,
      data: task,
      message: '任务创建成功',
    });
  } catch (error) {
    return _next(error);
  }
});

// 启动任务
router.post('/:id/start', authMiddleware, async (req, res, _next) => {
  try {
    const userId = (req as any).user._id;
    const taskId = req.params.id;
    
    const task = await TaskService.startTask(taskId, userId);
    
    res.json({
      success: true,
      data: task,
      message: '任务启动成功',
    });
  } catch (error) {
    return _next(error);
  }
});

// 更新任务进度
router.patch('/:id/progress', authMiddleware, async (req, res, _next) => {
  try {
    const userId = (req as any).user._id;
    const taskId = req.params.id;
    const { progress, status } = req.body;
    
    const task = await TaskService.updateTaskProgress(taskId, userId, progress, status);
    
    res.json({
      success: true,
      data: task,
      message: '任务进度更新成功',
    });
  } catch (error) {
    return _next(error);
  }
});

// 更新任务结果
router.patch('/:id/result', authMiddleware, async (req, res, _next) => {
  try {
    const userId = (req as any).user._id;
    const taskId = req.params.id;
    const result = req.body;
    
    const task = await TaskService.updateTaskResult(taskId, userId, result);
    
    res.json({
      success: true,
      data: task,
      message: '任务结果更新成功',
    });
  } catch (error) {
    return _next(error);
  }
});

// 删除任务
router.delete('/:id', authMiddleware, async (req, res, _next) => {
  try {
    const userId = (req as any).user._id;
    const taskId = req.params.id;
    
    await TaskService.deleteTask(taskId, userId);
    
    res.json({
      success: true,
      message: '任务删除成功',
    });
  } catch (error) {
    return _next(error);
  }
});

// 获取任务统计
router.get('/stats/summary', authMiddleware, async (req, res, _next) => {
  try {
    const userId = (req as any).user._id;
    
    const stats = await TaskService.getTaskStats(userId);
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return _next(error);
  }
});

export default router;