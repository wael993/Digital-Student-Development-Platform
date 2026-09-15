import mongoose, { Schema } from 'mongoose';

export const BUS_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE'] as const;
export type BusStatus = (typeof BUS_STATUSES)[number];

export interface Bus {
  organizationId: mongoose.Types.ObjectId;
  campusId: mongoose.Types.ObjectId;
  name: string;
  registrationNumber: string;
  capacity: number;
  status: BusStatus;
  driverId?: mongoose.Types.ObjectId;
  supervisorId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const busSchema = new Schema<Bus>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    campusId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true },
    registrationNumber: { type: String, required: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    status: { type: String, required: true, enum: BUS_STATUSES, default: 'ACTIVE' },
    driverId: { type: Schema.Types.ObjectId },
    supervisorId: { type: Schema.Types.ObjectId },
  },
  { timestamps: true, collection: 'buses' },
);

busSchema.index({ organizationId: 1, status: 1 });
busSchema.index({ organizationId: 1, campusId: 1 });
busSchema.index({ organizationId: 1, driverId: 1 });

export const BusModel = mongoose.models.Bus ?? mongoose.model<Bus>('Bus', busSchema);
