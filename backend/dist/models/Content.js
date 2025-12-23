import mongoose, { Schema } from 'mongoose';
const ContentSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    hashtags: [String],
    summary: {
        type: String,
        default: '',
    },
    theme: {
        type: String,
        required: true,
    },
    keywords: [String],
    targetAudience: {
        type: String,
        required: true,
    },
    style: {
        type: String,
        enum: ['formal', 'casual', 'professional', 'creative'],
        default: 'casual',
    },
    wordCount: {
        type: Number,
        default: 500,
    },
    images: [String],
    video: String,
    platform: {
        type: String,
        default: 'xiaohongshu',
    },
    generatedAt: {
        type: Date,
        default: Date.now,
    },
    publishedAt: Date,
    publishUrl: String,
    status: {
        type: String,
        enum: ['generated', 'published', 'failed'],
        default: 'generated',
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
});
// 添加索引以提高查询性能
ContentSchema.index({ createdBy: 1, generatedAt: -1 });
ContentSchema.index({ theme: 1 });
ContentSchema.index({ status: 1 });
ContentSchema.index({ 'hashtags': 1 });
// 虚拟字段：内容长度
ContentSchema.virtual('contentLength').get(function () {
    return this.content.length;
});
// 虚拟字段：标签数量
ContentSchema.virtual('hashtagCount').get(function () {
    return this.hashtags.length;
});
export const Content = mongoose.model('Content', ContentSchema);
