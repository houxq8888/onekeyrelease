/**
 * 自定义应用错误类
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // 确保正确的原型链
    Object.setPrototypeOf(this, AppError.prototype);

    // 捕获堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * 验证错误类
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400);
    this.name = 'ValidationError';
    
    if (details) {
      this.message = `${message}: ${JSON.stringify(details)}`;
    }
  }
}

/**
 * 认证错误类
 */
export class AuthenticationError extends AppError {
  constructor(message: string = '认证失败') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * 授权错误类
 */
export class AuthorizationError extends AppError {
  constructor(message: string = '权限不足') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * 资源未找到错误类
 */
export class NotFoundError extends AppError {
  constructor(message: string = '资源未找到') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * 冲突错误类
 */
export class ConflictError extends AppError {
  constructor(message: string = '资源冲突') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

/**
 * 服务不可用错误类
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = '服务暂时不可用') {
    super(message, 503);
    this.name = 'ServiceUnavailableError';
  }
}

/**
 * 错误处理工具函数
 */
export const errorHandler = {
  /**
   * 创建标准化的错误响应
   */
  createErrorResponse(error: any) {
    if (error instanceof AppError) {
      return {
        success: false,
        error: {
          message: error.message,
          code: error.statusCode,
          type: error.name
        }
      };
    }

    // 处理未知错误
    return {
      success: false,
      error: {
        message: process.env.NODE_ENV === 'production' ? '内部服务器错误' : error.message,
        code: 500,
        type: 'InternalServerError'
      }
    };
  },

  /**
   * 异步错误处理包装器
   */
  asyncHandler(fn: Function) {
    return (req: any, res: any, next: any) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
};