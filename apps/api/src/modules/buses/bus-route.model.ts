import mongoose, { Schema } from 'mongoose';

export const ROUTE_DIRECTIONS = ['HOME_TO_SCHOOL', 'SCHOOL_TO_HOME'] as const;
export type RouteDirection = (typeof ROUTE_DIRECTIONS)[number];

export const ROUTE_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type RouteStatus = (typeof ROUTE_STATUSES)[number];

export interface BusRoute {
  organizationId: mongoose.Types.ObjectId;
  campusId: mongoose.Types.ObjectId;
  name: string;
  busId: mongoose.Types.ObjectId;
  direction: RouteDirection;
  status: RouteStatus;
  estimatedStartTime?: string;
  estimatedEndTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

const busRouteSchema = new Schema<BusRoute>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    campusId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true },
    busId: { type: Schema.Types.ObjectId, required: true },
    direction: { type: String, required: true, enum: ROUTE_DIRECTIONS },
    status: { type: String, required: true, enum: ROUTE_STATUSES, default: 'ACTIVE' },
    estimatedStartTime: { type: String, trim: true },
    estimatedEndTime: { type: String, trim: true },
  },
  { timestamps: true, collection: 'bus_routes' },
);

busRouteSchema.index({ organizationId: 1, campusId: 1, status: 1 });
busRouteSchema.index({ organizationId: 1, busId: 1 });

export const BusRouteModel =
  mongoose.models.BusRoute ?? mongoose.model<BusRoute>('BusRoute', busRouteSchema);
