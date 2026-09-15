import mongoose, { Schema } from 'mongoose';
import { ROUTE_DIRECTIONS, type RouteDirection } from './bus-route.model';

export const TRANSPORT_METHODS = [
  'BUS',
  'PARENT_CAR',
  'PARENT_PICKUP',
  'AUTHORIZED_PICKUP',
  'OTHER',
] as const;
export type TransportMethod = (typeof TRANSPORT_METHODS)[number];

export const DAILY_PLAN_STATUSES = ['SCHEDULED', 'CANCELLED'] as const;
export type DailyPlanStatus = (typeof DAILY_PLAN_STATUSES)[number];

export interface DailyTransportPlan {
  organizationId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  date: string;
  direction: RouteDirection;
  transportMethod: TransportMethod;
  routeId?: mongoose.Types.ObjectId;
  stopId?: mongoose.Types.ObjectId;
  status: DailyPlanStatus;
  reason?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const dailyPlanSchema = new Schema<DailyTransportPlan>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    studentId: { type: Schema.Types.ObjectId, required: true },
    date: { type: String, required: true },
    direction: { type: String, required: true, enum: ROUTE_DIRECTIONS },
    transportMethod: { type: String, required: true, enum: TRANSPORT_METHODS },
    routeId: { type: Schema.Types.ObjectId },
    stopId: { type: Schema.Types.ObjectId },
    status: { type: String, required: true, enum: DAILY_PLAN_STATUSES, default: 'SCHEDULED' },
    reason: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true, collection: 'daily_transport_plans' },
);

dailyPlanSchema.index({ organizationId: 1, studentId: 1, date: 1, direction: 1 }, { unique: true });

export const DailyTransportPlanModel =
  mongoose.models.DailyTransportPlan ??
  mongoose.model<DailyTransportPlan>('DailyTransportPlan', dailyPlanSchema);
