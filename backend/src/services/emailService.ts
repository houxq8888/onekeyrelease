import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static enabled = false;
  private static mockEmails: any[] = [];

  /**
   * 发送邮件
   * @param options 邮件选项
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // 检查是否启用邮件服务
      if (!this.enabled) {
        logger.warn('邮件服务未启用，跳过发送');
        return false;
      }

      // 记录邮件到模拟存储
      this.mockEmails.push({
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        sentAt: new Date(),
      });

      logger.info(`邮件发送成功（模拟）: ${options.subject} -> ${options.to}`);
      return true;
    } catch (error: any) {
      logger.error(`邮件发送失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 发送任务提醒邮件
   * @param taskTitle 任务标题
   * @param publishTime 发布时间
   * @param emailList 邮箱列表
   */
  static async sendTaskReminder(
    taskTitle: string,
    publishTime: Date,
    emailList: string[]
  ): Promise<boolean> {
    const subject = `📋 任务发布提醒 - ${taskTitle}`;
    const publishDate = publishTime.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>任务发布提醒</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            padding: 20px;
            margin: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
          }
          .task-info {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .task-info h2 {
            margin: 0 0 10px;
            color: #667eea;
            font-size: 18px;
          }
          .task-info p {
            margin: 5px 0;
            color: #666;
          }
          .highlight {
            color: #764ba2;
            font-weight: 600;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 任务发布提醒</h1>
          </div>
          <div class="content">
            <div class="task-info">
              <h2>📝 任务信息</h2>
              <p><strong>任务名称：</strong><span class="highlight">${taskTitle}</span></p>
              <p><strong>发布时间：</strong><span class="highlight">${publishDate}</span></p>
              <p>您的任务即将发布，请确保内容已准备好。</p>
            </div>
            <div class="footer">
              <p>此邮件由 OneKeyRelease 系统自动发送，请勿回复。</p>
              <p>${new Date().toLocaleDateString('zh-CN')}</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `任务发布提醒\n\n任务名称：${taskTitle}\n发布时间：${publishDate}\n\n您的任务即将发布，请确保内容已准备好。`;

    return this.sendEmail({
      to: emailList,
      subject,
      html,
      text,
    });
  }

  /**
   * 启用邮件服务
   */
  static enable() {
    this.enabled = true;
    logger.info('邮件服务已启用');
  }

  /**
   * 禁用邮件服务
   */
  static disable() {
    this.enabled = false;
    logger.info('邮件服务已禁用');
  }

  /**
   * 获取已发送的邮件列表（用于测试）
   */
  static getSentEmails(): any[] {
    return this.mockEmails;
  }

  /**
   * 清空已发送的邮件列表
   */
  static clearSentEmails() {
    this.mockEmails = [];
    logger.info('已清空邮件记录');
  }
}
