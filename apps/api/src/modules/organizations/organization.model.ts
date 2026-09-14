import mongoose, { Schema } from 'mongoose';

export const ORGANIZATION_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

export interface Organization {
  name: string;
  status: OrganizationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<Organization>(
  {
    name: { type: String, required: true, trim: true },
    status: { type: String, required: true, enum: ORGANIZATION_STATUSES, default: 'ACTIVE' },
  },
  { timestamps: true, collection: 'organizations' },
);

export const OrganizationModel =
  mongoose.models.Organization ?? mongoose.model<Organization>('Organization', organizationSchema);
