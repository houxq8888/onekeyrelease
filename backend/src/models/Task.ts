import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  type: 'content_generation' | 'content_publish' | 'batch';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
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
  result?: {
    generatedContent?: string;
    images?: string[];
    video?: string;
    publishUrl?: string;
    error?: string;
  };
  createdBy: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
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
      enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
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
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startedAt: Date,
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
    (this as any).completedAt = new Date();
  }
  await (this as any).save();
};

export default mongoose.model<ITask, ITaskModel>('Task', TaskSchema);