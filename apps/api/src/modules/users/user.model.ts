import mongoose, { Schema } from 'mongoose';
import { USER_ROLES, USER_STATUSES, type UserRole, type UserStatus } from '../../types';

export interface User {
  organizationId: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  campusIds: mongoose.Types.ObjectId[];
  classroomIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<User>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    role: { type: String, required: true, enum: USER_ROLES },
    status: { type: String, required: true, enum: USER_STATUSES, default: 'ACTIVE' },
    campusIds: { type: [Schema.Types.ObjectId], required: true, default: [] },
    classroomIds: { type: [Schema.Types.ObjectId], required: true, default: [] },
  },
  { timestamps: true, collection: 'users' },
);

userSchema.index({ organizationId: 1, role: 1 });

export const UserModel = mongoose.models.User ?? mongoose.model<User>('User', userSchema);
