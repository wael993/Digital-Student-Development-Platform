import mongoose, { Schema } from 'mongoose';

export const DEVICE_PLATFORMS = ['ANDROID', 'IOS'] as const;
export type DevicePlatform = (typeof DEVICE_PLATFORMS)[number];

export const DEVICE_TOKEN_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type DeviceTokenStatus = (typeof DEVICE_TOKEN_STATUSES)[number];

export interface DeviceToken {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  token: string;
  platform: DevicePlatform;
  appVersion?: string;
  deviceId: string;
  status: DeviceTokenStatus;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const deviceTokenSchema = new Schema<DeviceToken>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    userId: { type: Schema.Types.ObjectId, required: true },
    token: { type: String, required: true },
    platform: { type: String, required: true, enum: DEVICE_PLATFORMS },
    appVersion: { type: String, trim: true },
    deviceId: { type: String, required: true, trim: true },
    status: { type: String, required: true, enum: DEVICE_TOKEN_STATUSES, default: 'ACTIVE' },
    lastUsedAt: { type: Date, required: true },
  },
  { timestamps: true, collection: 'device_tokens' },
);

deviceTokenSchema.index({ organizationId: 1, userId: 1, status: 1 });
deviceTokenSchema.index({ token: 1 }, { unique: true });
deviceTokenSchema.index({ organizationId: 1, userId: 1, deviceId: 1 }, { unique: true });

export const DeviceTokenModel =
  mongoose.models.DeviceToken ?? mongoose.model<DeviceToken>('DeviceToken', deviceTokenSchema);
