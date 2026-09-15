import mongoose, { Schema } from 'mongoose';

export const STOP_PROGRESS_STATUSES = ['APPROACHING', 'ARRIVED', 'DEPARTED'] as const;
export type StopProgressStatus = (typeof STOP_PROGRESS_STATUSES)[number];

export const PROGRESS_SOURCES = ['MANUAL', 'SYSTEM'] as const;
export type ProgressSource = (typeof PROGRESS_SOURCES)[number];

export interface RouteProgress {
  organizationId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  date: string;
  stopId: mongoose.Types.ObjectId;
  sequence: number;
  status: StopProgressStatus;
  occurredAt: Date;
  recordedBy: mongoose.Types.ObjectId;
  source: ProgressSource;
  parentsNotified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const routeProgressSchema = new Schema<RouteProgress>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    routeId: { type: Schema.Types.ObjectId, required: true },
    date: { type: String, required: true },
    stopId: { type: Schema.Types.ObjectId, required: true },
    sequence: { type: Number, required: true },
    status: { type: String, required: true, enum: STOP_PROGRESS_STATUSES },
    occurredAt: { type: Date, required: true },
    recordedBy: { type: Schema.Types.ObjectId, required: true },
    source: { type: String, required: true, enum: PROGRESS_SOURCES, default: 'MANUAL' },
    parentsNotified: { type: Boolean, required: true, default: false },
  },
  { timestamps: true, collection: 'route_progress' },
);

routeProgressSchema.index({ organizationId: 1, routeId: 1, date: 1, occurredAt: 1 });
routeProgressSchema.index({ organizationId: 1, routeId: 1, date: 1, stopId: 1 });

export const RouteProgressModel =
  mongoose.models.RouteProgress ??
  mongoose.model<RouteProgress>('RouteProgress', routeProgressSchema);
