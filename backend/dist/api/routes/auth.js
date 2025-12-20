import express from 'express';
import { AuthService } from '../../services/authService';
import { authMiddleware } from '../../middleware/auth';
const router = express.Router();
// 用户注册
router.post('/register', async (req, res, _next) => {
    try {
        const { username, password, email } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: '用户名和密码不能为空',
            });
        }
        const result = await AuthService.register({
            username,
            password,
            email,
        });
        return res.status(201).json({
            success: true,
            data: result,
            message: '注册成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 用户登录
router.post('/login', async (req, res, _next) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: '用户名和密码不能为空',
            });
        }
        const result = await AuthService.login({
            username,
            password,
        });
        return res.json({
            success: true,
            data: result,
            message: '登录成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 获取当前用户信息
router.get('/me', authMiddleware, async (req, res, _next) => {
    try {
        const user = req.user;
        return res.json({
            success: true,
            data: {
                user,
            },
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 刷新token
router.post('/refresh', async (req, res, _next) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                success: false,
                error: '请提供token',
            });
        }
        const newToken = await AuthService.refreshToken(token);
        return res.json({
            success: true,
            data: {
                token: newToken,
            },
            message: 'Token刷新成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 修改密码
router.post('/change-password', authMiddleware, async (req, res, _next) => {
    try {
        const userId = req.user._id;
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: '当前密码和新密码不能为空',
            });
        }
        await AuthService.changePassword(userId, currentPassword, newPassword);
        return res.json({
            success: true,
            message: '密码修改成功',
        });
    }
    catch (error) {
        return _next(error);
    }
});
// 验证token
router.post('/verify', async (req, res, _next) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({
                success: false,
                error: '请提供token',
            });
        }
        const user = await AuthService.verifyToken(token);
        return res.json({
            success: true,
            data: {
                user,
                valid: true,
            },
        });
    }
    catch (error) {
        return res.json({
            success: false,
            data: {
                valid: false,
            },
            error: 'Token无效',
        });
    }
});
export default router;
