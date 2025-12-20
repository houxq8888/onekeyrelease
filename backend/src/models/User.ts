import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  password: string;
  email?: string;
  role: 'admin' | 'user';
  isActive: boolean;
  lastLogin?: Date;
  loginCount: number;
  preferences: {
    theme: 'light' | 'dark';
    language: 'zh-CN' | 'en-US';
    notifications: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  
  // 方法
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema(
  {
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
  },
  {
    timestamps: true,
  }
);

// 添加索引
UserSchema.index({ username: 1 });
UserSchema.index({ email: 1 }, { sparse: true });

// 保存前加密密码
UserSchema.pre('save', async function(next) {
  if (!(this as any).isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    (this as any).password = await bcrypt.hash((this as any).password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// 比较密码方法
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// 定义静态方法接口
interface IUserModel extends Model<IUser> {
  createAdmin(username: string, password: string, email?: string): Promise<IUser>;
  findByUsernameWithPassword(username: string): Promise<IUser | null>;
}

// 静态方法：创建管理员用户
UserSchema.statics.createAdmin = async function(username: string, password: string, email?: string) {
  const admin = new this({
    username,
    password,
    email,
    role: 'admin',
  });
  return await admin.save();
};

// 静态方法：根据用户名查找用户（包含密码）
UserSchema.statics.findByUsernameWithPassword = function(username: string) {
  return this.findOne({ username }).select('+password');
};

// 实例方法：更新最后登录时间
UserSchema.methods.updateLastLogin = async function() {
  (this as any).lastLogin = new Date();
  (this as any).loginCount += 1;
  await (this as any).save();
};

export default mongoose.model<IUser, IUserModel>('User', UserSchema);