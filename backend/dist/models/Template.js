import mongoose, { Schema } from 'mongoose';
// 模板Schema
const TemplateSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    category: {
        type: String,
        required: true,
        enum: ['美食', '旅行', '美妆', '穿搭', '家居', '育儿', '其他']
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    titleStructure: {
        type: [String],
        required: true
    },
    contentFramework: {
        type: [String],
        required: true
    },
    tagSuggestions: {
        type: [String],
        required: true
    },
    imageCountSuggestion: {
        type: Number,
        required: true,
        min: 0,
        max: 10
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});
// 模板收藏Schema
const TemplateFavoriteSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    templateId: {
        type: Schema.Types.ObjectId,
        ref: 'Template',
        required: true
    }
}, {
    timestamps: true
});
// 创建复合索引，确保每个用户只能收藏一次同一个模板
TemplateFavoriteSchema.index({ userId: 1, templateId: 1 }, { unique: true });
// 模型导出
export const Template = mongoose.model('Template', TemplateSchema);
export const TemplateFavorite = mongoose.model('TemplateFavorite', TemplateFavoriteSchema);
