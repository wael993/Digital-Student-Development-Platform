import mongoose, { Schema } from 'mongoose';
import type { TenantRole } from '../../types';

export const INVITATION_STATUSES = ['PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export interface UserInvitation {
  organizationId: mongoose.Types.ObjectId;
  email: string;
  role: TenantRole;
  firstName: string;
  lastName: string;
  campusIds: mongoose.Types.ObjectId[];
  classroomIds: mongoose.Types.ObjectId[];
  routeIds: mongoose.Types.ObjectId[];
  tokenHash: string;
  expiresAt: Date;
  invitedBy: mongoose.Types.ObjectId;
  acceptedAt?: Date | null;
  status: InvitationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const userInvitationSchema = new Schema<UserInvitation>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    campusIds: { type: [Schema.Types.ObjectId], required: true, default: [] },
    classroomIds: { type: [Schema.Types.ObjectId], required: true, default: [] },
    routeIds: { type: [Schema.Types.ObjectId], required: true, default: [] },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    invitedBy: { type: Schema.Types.ObjectId, required: true },
    acceptedAt: { type: Date, default: null },
    status: { type: String, required: true, enum: INVITATION_STATUSES, default: 'PENDING' },
  },
  { timestamps: true, collection: 'user_invitations' },
);

userInvitationSchema.index({ organizationId: 1, email: 1, status: 1 });

export const UserInvitationModel =
  mongoose.models.UserInvitation ??
  mongoose.model<UserInvitation>('UserInvitation', userInvitationSchema);
