import mongoose, { Schema } from 'mongoose';

export const NOTIFICATION_TYPES = [
  'STUDENT_ARRIVAL',
  'STUDENT_DEPARTURE',
  'STUDENT_HOME_DROPOFF',
  'JOURNEY_UPDATE',
  'MEDIA_AVAILABLE',
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_STATUSES = ['PENDING', 'SENT', 'FAILED', 'READ'] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export interface Notification {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string>;
  status: NotificationStatus;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<Notification>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    userId: { type: Schema.Types.ObjectId, required: true },
    studentId: { type: Schema.Types.ObjectId, required: true },
    type: { type: String, required: true, enum: NOTIFICATION_TYPES },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed, required: true, default: {} },
    status: { type: String, required: true, enum: NOTIFICATION_STATUSES, default: 'PENDING' },
    sentAt: { type: Date },
    readAt: { type: Date },
  },
  { timestamps: true, collection: 'notifications' },
);

notificationSchema.index({ organizationId: 1, userId: 1, createdAt: -1 });
notificationSchema.index({ organizationId: 1, userId: 1, readAt: 1, createdAt: -1 });

export const NotificationModel =
  mongoose.models.AppNotification ??
  mongoose.model<Notification>('AppNotification', notificationSchema);
