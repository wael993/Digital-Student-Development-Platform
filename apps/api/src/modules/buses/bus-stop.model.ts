import mongoose, { Schema } from 'mongoose';

export interface BusStop {
  organizationId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  sequence: number;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  createdAt: Date;
  updatedAt: Date;
}

const busStopSchema = new Schema<BusStop>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    routeId: { type: Schema.Types.ObjectId, required: true },
    sequence: { type: Number, required: true, min: 1 },
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  { timestamps: true, collection: 'bus_stops' },
);

busStopSchema.index({ organizationId: 1, routeId: 1, sequence: 1 }, { unique: true });

export const BusStopModel =
  mongoose.models.BusStop ?? mongoose.model<BusStop>('BusStop', busStopSchema);
