import mongoose, { Schema } from 'mongoose';

export interface NotificationPreferences {
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  journeyUpdates: boolean;
  studentArrival: boolean;
  studentDeparture: boolean;
  homeDropoff: boolean;
  mediaAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_NOTIFICATION_PREFERENCES = {
  journeyUpdates: true,
  studentArrival: true,
  studentDeparture: true,
  homeDropoff: true,
  mediaAvailable: true,
} as const;

const notificationPreferencesSchema = new Schema<NotificationPreferences>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    userId: { type: Schema.Types.ObjectId, required: true },
    journeyUpdates: { type: Boolean, required: true, default: true },
    studentArrival: { type: Boolean, required: true, default: true },
    studentDeparture: { type: Boolean, required: true, default: true },
    homeDropoff: { type: Boolean, required: true, default: true },
    mediaAvailable: { type: Boolean, required: true, default: true },
    // note: quietHours start/end wait for a later ticket; keep these flags the preference surface.
  },
  { timestamps: true, collection: 'notification_preferences' },
);

notificationPreferencesSchema.index({ organizationId: 1, userId: 1 }, { unique: true });

export const NotificationPreferencesModel =
  mongoose.models.NotificationPreferences ??
  mongoose.model<NotificationPreferences>('NotificationPreferences', notificationPreferencesSchema);
