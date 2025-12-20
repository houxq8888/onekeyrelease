import express from 'express';
import { AccountService } from '../../services/accountService';
import { authMiddleware } from '../../middleware/auth';
const router = express.Router();
// 获取账号列表
router.get('/', authMiddleware, async (req, res, _next) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10, platform, status } = req.query;
        const result = await AccountService.getUserAccounts(userId, parseInt(page), parseInt(limit), platform, status);
        return res.json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 获取账号详情
router.get('/:id', authMiddleware, async (req, res, _next) => {
    try {
        const userId = req.user._id;
        const accountId = req.params.id;
        const account = await AccountService.getAccountById(accountId, userId);
        return res.json({
            success: true,
            data: account,
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 创建账号
router.post('/', authMiddleware, async (req, res, _next) => {
    try {
        const userId = req.user._id;
        const accountData = {
            ...req.body,
            createdBy: userId,
        };
        const account = await AccountService.createAccount(accountData);
        return res.status(201).json({
            success: true,
            data: account,
            message: '账号添加成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 更新账号
router.put('/:id', authMiddleware, async (req, res, _next) => {
    try {
        const userId = req.user._id;
        const accountId = req.params.id;
        const updateData = req.body;
        const account = await AccountService.updateAccount(accountId, userId, updateData);
        return res.json({
            success: true,
            data: account,
            message: '账号更新成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 测试账号
router.post('/:id/test', authMiddleware, async (req, res, _next) => {
    try {
        const userId = req.user._id;
        const accountId = req.params.id;
        const account = await AccountService.testAccount(accountId, userId);
        return res.json({
            success: true,
            data: account,
            message: '账号测试成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 删除账号
router.delete('/:id', authMiddleware, async (req, res, _next) => {
    try {
        const userId = req.user._id;
        const accountId = req.params.id;
        await AccountService.deleteAccount(accountId, userId);
        return res.json({
            success: true,
            message: '账号删除成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 获取账号统计
router.get('/stats/summary', authMiddleware, async (req, res, _next) => {
    try {
        const userId = req.user._id;
        const stats = await AccountService.getAccountStats(userId);
        return res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 批量测试账号
router.post('/batch/test', authMiddleware, async (req, res, _next) => {
    try {
        const userId = req.user._id;
        const { accountIds } = req.body;
        if (!accountIds || !Array.isArray(accountIds)) {
            return res.status(400).json({
                success: false,
                error: '请提供有效的账号ID列表',
            });
        }
        const results = await AccountService.batchTestAccounts(accountIds, userId);
        return res.json({
            success: true,
            data: results,
            message: '批量测试完成',
        });
    }
    catch (error) {
        return _next(error);
    }
});
export default router;
