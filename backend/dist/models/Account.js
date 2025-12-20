import mongoose, { Schema } from 'mongoose';
const AccountSchema = new Schema({
    platform: {
        type: String,
        enum: ['xiaohongshu'],
        required: true,
    },
    username: {
        type: String,
        required: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    nickname: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'error'],
        default: 'inactive',
    },
    cookies: {
        type: String,
        select: false, // 默认不返回
    },
    lastLogin: Date,
    loginCount: {
        type: Number,
        default: 0,
    },
    errorCount: {
        type: Number,
        default: 0,
    },
    lastError: String,
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});
// 添加索引
AccountSchema.index({ createdBy: 1, platform: 1 });
AccountSchema.index({ username: 1 }, { unique: true });
// 虚拟字段：平台显示名称
AccountSchema.virtual('platformName').get(function () {
    const platformNames = {
        xiaohongshu: '小红书',
    };
    return platformNames[this.platform] || this.platform;
});
// 静态方法：根据平台统计账号
AccountSchema.statics.getStatsByPlatform = async function (userId) {
    const stats = await this.aggregate([
        { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
        { $group: {
                _id: '$platform',
                total: { $sum: 1 },
                active: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'active'] }, 1, 0]
                    }
                },
                error: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'error'] }, 1, 0]
                    }
                },
            } },
    ]);
    return stats;
};
// 实例方法：更新账号状态
AccountSchema.methods.updateStatus = async function (status, error) {
    this.status = status;
    if (error) {
        this.lastError = error;
        this.errorCount += 1;
    }
    if (status === 'active') {
        this.lastLogin = new Date();
        this.loginCount += 1;
        this.errorCount = 0; // 重置错误计数
    }
    await this.save();
};
// 实例方法：验证账号信息
AccountSchema.methods.validateCredentials = function () {
    if (!this.username || !this.password) {
        throw new Error('用户名和密码不能为空');
    }
    if (this.username.length < 3) {
        throw new Error('用户名长度不能少于3个字符');
    }
    if (this.password.length < 6) {
        throw new Error('密码长度不能少于6个字符');
    }
    return true;
};
export default mongoose.model('Account', AccountSchema);
