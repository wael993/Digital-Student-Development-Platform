import mongoose, { Schema } from 'mongoose';
import { USER_ROLES, USER_STATUSES, type UserRole, type UserStatus } from '../../types';

export interface User {
  /** Absent for PLATFORM_ADMIN. Required for all tenant roles. */
  organizationId?: mongoose.Types.ObjectId | null;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  /** Field ready for SECURITY-002; MFA not enforced yet. */
  mfaEnabled: boolean;
  lastLoginAt?: Date;
  campusIds: mongoose.Types.ObjectId[];
  classroomIds: mongoose.Types.ObjectId[];
  routeIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<User>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: false, default: null, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: USER_ROLES },
    status: { type: String, required: true, enum: USER_STATUSES, default: 'ACTIVE' },
    mfaEnabled: { type: Boolean, required: true, default: false },
    lastLoginAt: { type: Date },
    campusIds: { type: [Schema.Types.ObjectId], required: true, default: [] },
    classroomIds: { type: [Schema.Types.ObjectId], required: true, default: [] },
    routeIds: { type: [Schema.Types.ObjectId], required: true, default: [] },
  },
  { timestamps: true, collection: 'users' },
);

userSchema.index({ organizationId: 1, role: 1 });

export const UserModel = mongoose.models.User ?? mongoose.model<User>('User', userSchema);
