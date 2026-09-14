import mongoose, { Schema } from 'mongoose';

export const CAMPUS_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type CampusStatus = (typeof CAMPUS_STATUSES)[number];

export interface Campus {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  status: CampusStatus;
  createdAt: Date;
  updatedAt: Date;
}

const campusSchema = new Schema<Campus>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true },
    status: { type: String, required: true, enum: CAMPUS_STATUSES, default: 'ACTIVE' },
  },
  { timestamps: true, collection: 'campuses' },
);

campusSchema.index({ organizationId: 1, name: 1 });

export const CampusModel = mongoose.models.Campus ?? mongoose.model<Campus>('Campus', campusSchema);
