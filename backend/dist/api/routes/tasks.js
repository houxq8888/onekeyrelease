import express from 'express';
import { TaskService } from '../../services/taskService';
import { demoAuthMiddleware } from '../../middleware/auth';
const router = express.Router();
// 获取任务列表
router.get('/', demoAuthMiddleware, async (req, res, _next) => {
    try {
        const userId = req.user._id;
        const { status } = req.query;
        let tasks = await TaskService.getTasks(userId);
        // 按状态过滤
        if (status) {
            tasks = tasks.filter(task => task.status === status);
        }
        res.json({
            success: true,
            data: tasks,
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 获取任务详情
router.get('/:id', demoAuthMiddleware, async (req, res, _next) => {
    try {
        const userId = req.user._id;
        const taskId = req.params.id;
        const task = await TaskService.getTaskById(taskId, userId);
        res.json({
            success: true,
            data: task,
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 创建任务
router.post('/', demoAuthMiddleware, async (req, res, _next) => {
    try {
        const userId = req.user._id;
        const taskData = req.body;
        const task = await TaskService.createTask(userId, taskData);
        res.status(201).json({
            success: true,
            data: task,
            message: '任务创建成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 启动任务
router.post('/:id/start', demoAuthMiddleware, async (req, res, _next) => {
    try {
        const userId = req.user._id;
        const taskId = req.params.id;
        const task = await TaskService.startTask(taskId, userId);
        res.json({
            success: true,
            data: task,
            message: '任务启动成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 更新任务进度
router.patch('/:id/progress', demoAuthMiddleware, async (req, res, _next) => {
    try {
        const userId = req.user._id;
        const taskId = req.params.id;
        const { progress, status } = req.body;
        const task = await TaskService.updateTaskProgress(taskId, userId, progress, status);
        res.json({
            success: true,
            data: task,
            message: '任务进度更新成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 更新任务结果
router.patch('/:id/result', demoAuthMiddleware, async (req, res, _next) => {
    try {
        const userId = req.user._id;
        const taskId = req.params.id;
        const result = req.body;
        const task = await TaskService.updateTaskResult(taskId, userId, result);
        res.json({
            success: true,
            data: task,
            message: '任务结果更新成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 删除任务
router.delete('/:id', demoAuthMiddleware, async (req, res, _next) => {
    try {
        const userId = req.user._id;
        const taskId = req.params.id;
        await TaskService.deleteTask(taskId, userId);
        res.json({
            success: true,
            message: '任务删除成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 获取任务统计
router.get('/stats/summary', demoAuthMiddleware, async (req, res, _next) => {
    try {
        const userId = req.user._id;
        const stats = await TaskService.getTaskStats(userId);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        return _next(error);
    }
});
export default router;
