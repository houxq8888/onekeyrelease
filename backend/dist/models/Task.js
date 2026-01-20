import mongoose, { Schema } from 'mongoose';
const TaskSchema = new Schema({
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
        enum: ['pending', 'running', 'completed', 'failed', 'cancelled', 'paused'],
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
    logs: [
        {
            timestamp: {
                type: Date,
                default: Date.now,
            },
            level: {
                type: String,
                enum: ['info', 'warning', 'error', 'debug'],
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
    executionContext: {
        currentStep: String,
        stepProgress: Number,
        stepData: Schema.Types.Mixed,
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
    completedAt: Date,
    pausedAt: Date,
    resumedAt: Date,
}, {
    timestamps: true,
});
// 添加索引以提高查询性能
TaskSchema.index({ createdBy: 1, status: 1 });
TaskSchema.index({ type: 1, status: 1 });
TaskSchema.index({ createdAt: -1 });
// 虚拟字段：任务持续时间
TaskSchema.virtual('duration').get(function () {
    if (this.startedAt && this.completedAt) {
        return this.completedAt.getTime() - this.startedAt.getTime();
    }
    return null;
});
// 静态方法：根据状态统计任务数量
TaskSchema.statics.getStatsByStatus = async function (userId) {
    const stats = await this.aggregate([
        { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
        { $group: {
                _id: '$status',
                count: { $sum: 1 }
            } },
    ]);
    const result = {
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
TaskSchema.methods.updateProgress = async function (progress, status) {
    this.progress = progress;
    if (status) {
        this.status = status;
    }
    if (progress === 100 && !this.completedAt) {
        this.completedAt = new Date();
    }
    await this.save();
};
export default mongoose.model('Task', TaskSchema);
