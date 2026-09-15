import mongoose, { Schema } from 'mongoose';

export interface RouteSegment {
  organizationId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  fromStopId: mongoose.Types.ObjectId;
  toStopId: mongoose.Types.ObjectId;
  estimatedMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}

const routeSegmentSchema = new Schema<RouteSegment>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    routeId: { type: Schema.Types.ObjectId, required: true },
    fromStopId: { type: Schema.Types.ObjectId, required: true },
    toStopId: { type: Schema.Types.ObjectId, required: true },
    estimatedMinutes: { type: Number, required: true, min: 0 },
  },
  { timestamps: true, collection: 'route_segments' },
);

routeSegmentSchema.index(
  { organizationId: 1, routeId: 1, fromStopId: 1, toStopId: 1 },
  { unique: true },
);

export const RouteSegmentModel =
  mongoose.models.RouteSegment ?? mongoose.model<RouteSegment>('RouteSegment', routeSegmentSchema);
