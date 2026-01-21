import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  type: 'content_generation' | 'content_publish' | 'batch';
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  config: {
    contentConfig?: {
      theme: string;
      keywords: string[];
      targetAudience: string;
      style: 'formal' | 'casual' | 'professional' | 'creative';
      wordCount: number;
    };
    publishConfig?: {
      accountId: string;
      platform: 'xiaohongshu';
      scheduleTime?: Date;
      autoPublish: boolean;
    };
  };
  notificationConfig?: {
    enabled: boolean;
    emailList: string[];
    remindBeforeDays: number;
  };
  result?: {
    generatedContent?: string;
    images?: string[];
    video?: string;
    publishUrl?: string;
    error?: string;
  };
  logs?: Array<{
    timestamp: Date;
    level: 'info' | 'warning' | 'error';
    message: string;
    details?: any;
  }>;
  createdBy: string;
  startedAt?: Date;
  pausedAt?: Date;
  resumedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // 实例方法
  updateProgress: (progress: number, status?: string) => Promise<void>;
  addLog: (level: 'info' | 'warning' | 'error', message: string, details?: any) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  cancel: () => Promise<void>;
}

const TaskSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['content_generation', 'content_publish', 'batch'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'paused', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    config: {
      contentConfig: {
        theme: String,
        keywords: [String],
        targetAudience: String,
        style: {
          type: String,
          enum: ['formal', 'casual', 'professional', 'creative'],
        },
        wordCount: Number,
      },
      publishConfig: {
        accountId: {
          type: Schema.Types.ObjectId,
          ref: 'Account',
        },
        platform: {
          type: String,
          enum: ['xiaohongshu'],
        },
        scheduleTime: Date,
        autoPublish: Boolean,
      },
    },
    result: {
      generatedContent: String,
      images: [String],
      video: String,
      publishUrl: String,
      error: String,
    },
    logs: {
      type: [
        {
          timestamp: {
            type: Date,
            default: Date.now,
          },
          level: {
            type: String,
            enum: ['info', 'warning', 'error'],
            default: 'info',
          },
          message: {
            type: String,
            required: true,
          },
          details: {
            type: Schema.Types.Mixed,
          },
        },
      ],
      default: [],
    },
    notificationConfig: {
      enabled: {
        type: Boolean,
        default: false,
      },
      emailList: {
        type: [String],
        default: [],
      },
      remindBeforeDays: {
        type: Number,
        default: 1,
        min: 1,
        max: 30,
      },
    },
    createdBy: {
      type: Schema.Types.Mixed,
      required: true,
    },
    startedAt: Date,
    pausedAt: Date,
    resumedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  }
);

// 添加索引以提高查询性能
TaskSchema.index({ createdBy: 1, status: 1 });
TaskSchema.index({ type: 1, status: 1 });
TaskSchema.index({ createdAt: -1 });

// 虚拟字段：任务持续时间
TaskSchema.virtual('duration').get(function() {
  if ((this as any).startedAt && (this as any).completedAt) {
    return (this as any).completedAt.getTime() - (this as any).startedAt.getTime();
  }
  return null;
});

// 定义静态方法接口
interface ITaskModel extends Model<ITask> {
  getStatsByStatus(userId: string): Promise<Record<string, number>>;
}

// 静态方法：根据状态统计任务数量
TaskSchema.statics.getStatsByStatus = async function(userId: string) {
  const stats = await this.aggregate([
    { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
    { $group: { 
        _id: '$status', 
        count: { $sum: 1 } 
    }},
  ]);
  
  const result: Record<string, number> = {
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
  });
  
  return result;
};

// 实例方法：更新任务进度
TaskSchema.methods.updateProgress = async function(progress: number, status?: string) {
  (this as any).progress = progress;
  if (status) {
    (this as any).status = status;
  }
  if (progress === 100 && !(this as any).completedAt) {
    (this as any).status = 'completed';
    (this as any).completedAt = new Date();
  }
  await (this as any).save();
};

// 实例方法：添加任务日志
TaskSchema.methods.addLog = async function(level: 'info' | 'warning' | 'error', message: string, details?: any) {
  const logEntry = {
    timestamp: new Date(),
    level,
    message,
    details,
  };
  (this as any).logs = [...((this as any).logs || []), logEntry];
  await (this as any).save();
};

// 实例方法：暂停任务
TaskSchema.methods.pause = async function() {
  (this as any).status = 'paused';
  (this as any).pausedAt = new Date();
  await (this as any).addLog('info', '任务已暂停');
  await (this as any).save();
};

// 实例方法：恢复任务
TaskSchema.methods.resume = async function() {
  (this as any).status = 'running';
  (this as any).resumedAt = new Date();
  await (this as any).addLog('info', '任务已恢复执行');
  await (this as any).save();
};

// 实例方法：取消任务
TaskSchema.methods.cancel = async function() {
  (this as any).status = 'cancelled';
  (this as any).completedAt = new Date();
  await (this as any).addLog('info', '任务已取消');
  await (this as any).save();
};

export default mongoose.model<ITask, ITaskModel>('Task', TaskSchema);