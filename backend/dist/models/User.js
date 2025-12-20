import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30,
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false, // 默认不返回密码
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱地址'],
    },
    role: {
        type: String,
        enum: ['admin', 'user'],
        default: 'user',
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: Date,
    loginCount: {
        type: Number,
        default: 0,
    },
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light',
        },
        language: {
            type: String,
            enum: ['zh-CN', 'en-US'],
            default: 'zh-CN',
        },
        notifications: {
            type: Boolean,
            default: true,
        },
    },
}, {
    timestamps: true,
});
// 添加索引
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 }, { sparse: true });
// 保存前加密密码
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next();
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    }
    catch (error) {
        next(error);
    }
});
// 比较密码方法
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
// 静态方法：创建管理员用户
UserSchema.statics.createAdmin = async function (username, password, email) {
    const admin = new this({
        username,
        password,
        email,
        role: 'admin',
    });
    return await admin.save();
};
// 静态方法：根据用户名查找用户（包含密码）
UserSchema.statics.findByUsernameWithPassword = function (username) {
    return this.findOne({ username }).select('+password');
};
// 实例方法：更新最后登录时间
UserSchema.methods.updateLastLogin = async function () {
    this.lastLogin = new Date();
    this.loginCount += 1;
    await this.save();
};
export default mongoose.model('User', UserSchema);
