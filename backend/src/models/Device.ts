import mongoose, { Document, Schema } from 'mongoose';

export interface IDevice extends Document {
  deviceId: string;
  deviceName: string;
  platform: 'android' | 'ios' | 'web';
  version?: string;
  deviceType?: string;
  registeredAt: Date;
  lastActiveAt: Date;
  isOnline: boolean;
  status: 'active' | 'inactive' | 'disabled';
  metadata?: {
    manufacturer?: string;
    model?: string;
    osVersion?: string;
    appVersion?: string;
  };
}

const DeviceSchema: Schema = new Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  deviceName: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    enum: ['android', 'ios', 'web'],
    required: true
  },
  version: {
    type: String,
    default: '1.0.0'
  },
  deviceType: {
    type: String
  },
  registeredAt: {
    type: Date,
    default: Date.now
  },
  lastActiveAt: {
    type: Date,
    default: Date.now
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'disabled'],
    default: 'active'
  },
  metadata: {
    manufacturer: String,
    model: String,
    osVersion: String,
    appVersion: String
  }
}, {
  timestamps: true
});

// 创建索引
DeviceSchema.index({ deviceId: 1 });
DeviceSchema.index({ platform: 1 });
DeviceSchema.index({ status: 1 });
DeviceSchema.index({ lastActiveAt: -1 });

export default mongoose.model<IDevice>('Device', DeviceSchema);