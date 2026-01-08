import express from 'express';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { MobileService } from '../services/mobileService';
import { PairingService } from '../services/pairingService';
import { QRCodeService } from '../services/qrCodeService';
const router = express.Router();
/**
 * 移动端API信息
 */
router.get('/', async (_req, res) => {
    res.json({
        message: 'OneKeyRelease 移动端API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
            command: '/api/v1/mobile/command',
            status: '/api/v1/mobile/status/:taskId',
            content: '/api/v1/mobile/content/:deviceId',
            device_register: '/api/v1/mobile/device/register'
        }
    });
});
/**
 * 移动端指令接口
 * 手机端发送指令给电脑端生成内容
 */
router.post('/command', async (req, res, next) => {
    try {
        const { deviceId, command, params, platform = 'xiaohongshu' } = req.body;
        if (!deviceId || !command) {
            throw new AppError('缺少必要参数: deviceId 和 command', 400);
        }
        logger.info(`收到移动端指令: ${command}`, { deviceId, params });
        // 处理不同类型的指令
        const result = await MobileService.handleCommand({
            deviceId,
            command,
            params,
            platform
        });
        res.json({
            success: true,
            data: result,
            message: '指令已接收，正在处理中'
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取内容生成状态
 */
router.get('/status/:taskId', async (req, res, next) => {
    try {
        const { taskId } = req.params;
        if (!taskId) {
            throw new AppError('缺少任务ID', 400);
        }
        const status = await MobileService.getTaskStatus(taskId);
        res.json({
            success: true,
            data: status
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取已生成的内容列表
 */
router.get('/content/:deviceId', async (req, res, next) => {
    try {
        const { deviceId } = req.params;
        const { page = 1, pageSize = 10 } = req.query;
        if (!deviceId) {
            throw new AppError('缺少设备ID', 400);
        }
        const contents = await MobileService.getDeviceContents(deviceId, parseInt(page), parseInt(pageSize));
        res.json({
            success: true,
            data: contents
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 下载内容到手机
 */
router.get('/content/download/:contentId', async (req, res, next) => {
    try {
        const { contentId } = req.params;
        if (!contentId) {
            throw new AppError('缺少内容ID', 400);
        }
        const content = await MobileService.downloadContent(contentId);
        // 设置下载头信息
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="content-${contentId}.json"`);
        res.json({
            success: true,
            data: content
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 设备注册接口
 */
router.post('/device/register', async (req, res, next) => {
    try {
        const { deviceId, deviceType, deviceName, platform = 'android' } = req.body;
        if (!deviceId) {
            throw new AppError('缺少设备ID', 400);
        }
        const device = await MobileService.registerDevice({
            deviceId,
            deviceType,
            deviceName,
            platform
        });
        // 设置正确的字符编码
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json({
            success: true,
            data: device,
            message: '设备注册成功'
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 获取已注册设备列表
 */
router.get('/devices', async (_req, res, next) => {
    try {
        const devices = await MobileService.getRegisteredDevices();
        // 设置正确的字符编码
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json({
            success: true,
            data: devices,
            message: '设备列表获取成功'
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 生成设备配对二维码
 */
router.post('/qrcode', async (req, res, next) => {
    try {
        const { deviceId, serverUrl, type = 'pairing' } = req.body;
        if (!deviceId || !serverUrl) {
            throw new AppError('缺少必要参数: deviceId 和 serverUrl', 400);
        }
        let qrCode, data;
        switch (type) {
            case 'pairing':
                qrCode = await QRCodeService.generatePairingQRCode(deviceId, serverUrl);
                data = QRCodeService.parseQRCodeData(qrCode);
                break;
            case 'connection':
                qrCode = await QRCodeService.generateConnectionQRCode(deviceId, serverUrl);
                data = QRCodeService.parseQRCodeData(qrCode);
                break;
            default:
                throw new AppError(`不支持的二维码类型: ${type}`, 400);
        }
        res.json({
            success: true,
            data: { qrCode, data },
            message: '二维码生成成功'
        });
    }
    catch (error) {
        next(error);
    }
});
/**
 * 生成连接二维码
 */
router.post('/pairing/connection-qrcode', async (req, res, next) => {
    try {
        const { deviceId } = req.body;
        const serverUrl = req.protocol + '://' + req.get('host');
        if (!deviceId) {
            throw new AppError('缺少设备ID', 400);
        }
        const qrCode = await PairingService.generateConnectionQRCode(deviceId, serverUrl);
        res.json({
            success: true,
            data: { qrCode },
            message: '连接二维码生成成功'
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
