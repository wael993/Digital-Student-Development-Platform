import mongoose, { Schema } from 'mongoose';

export const GUARDIAN_RELATIONSHIPS = ['MOTHER', 'FATHER', 'LEGAL_GUARDIAN', 'OTHER'] as const;
export type GuardianRelationshipType = (typeof GUARDIAN_RELATIONSHIPS)[number];

export interface StudentGuardian {
  organizationId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  relationship: GuardianRelationshipType;
  isPrimary: boolean;
  canPickup: boolean;
  receivesNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const studentGuardianSchema = new Schema<StudentGuardian>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    studentId: { type: Schema.Types.ObjectId, required: true },
    userId: { type: Schema.Types.ObjectId, required: true },
    relationship: { type: String, required: true, enum: GUARDIAN_RELATIONSHIPS },
    isPrimary: { type: Boolean, required: true, default: false },
    canPickup: { type: Boolean, required: true, default: true },
    receivesNotifications: { type: Boolean, required: true, default: true },
  },
  { timestamps: true, collection: 'student_guardians' },
);

studentGuardianSchema.index({ organizationId: 1, studentId: 1, userId: 1 }, { unique: true });
studentGuardianSchema.index({ organizationId: 1, userId: 1 });
studentGuardianSchema.index({ organizationId: 1, studentId: 1 });

export const StudentGuardianModel =
  mongoose.models.StudentGuardian ??
  mongoose.model<StudentGuardian>('StudentGuardian', studentGuardianSchema);
