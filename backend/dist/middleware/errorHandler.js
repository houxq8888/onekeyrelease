import { logger } from '../utils/logger.js';
export class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        // 确保正确的原型链
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
export function errorHandler(error, req, res, _next) {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal Server Error';
    // 记录错误日志
    logger.error({
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });
    // 生产环境下不暴露错误详情
    if (process.env.NODE_ENV === 'production' && !error.isOperational) {
        message = 'Something went wrong';
    }
    res.status(statusCode).json({
        success: false,
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
}
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
export function createError(message, statusCode = 500) {
    return new AppError(message, statusCode, true);
}
