import mongoose, { Schema } from 'mongoose';
const TemplateSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    category: {
        type: String,
        enum: ['美食', '旅行', '美妆', '穿搭', '家居', '育儿', '其他'],
        required: true,
    },
    titleStructure: {
        type: String,
        required: true,
    },
    contentFramework: {
        type: String,
        required: true,
    },
    tagSuggestions: {
        type: [String],
        default: [],
    },
    imageCountSuggestion: {
        type: Number,
        default: 3,
    },
    description: {
        type: String,
        default: '',
    },
    isPreset: {
        type: Boolean,
        default: false,
    },
    isFavorite: {
        type: Boolean,
        default: false,
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
TemplateSchema.index({ category: 1 });
TemplateSchema.index({ isFavorite: 1 });
TemplateSchema.index({ createdBy: 1 });
export const Template = mongoose.model('Template', TemplateSchema);
