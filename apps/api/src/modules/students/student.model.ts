import mongoose, { Schema } from 'mongoose';

export const STUDENT_STATUSES = ['ACTIVE', 'INACTIVE', 'TRANSFERRED', 'GRADUATED'] as const;
export type StudentStatus = (typeof STUDENT_STATUSES)[number];

export const STUDENT_GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const;
export type StudentGender = (typeof STUDENT_GENDERS)[number];

export interface Student {
  organizationId: mongoose.Types.ObjectId;
  campusId: mongoose.Types.ObjectId;
  classroomId: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: StudentGender;
  studentNumber: string;
  status: StudentStatus;
  qrToken: string;
  createdAt: Date;
  updatedAt: Date;
}

const studentSchema = new Schema<Student>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    campusId: { type: Schema.Types.ObjectId, required: true },
    classroomId: { type: Schema.Types.ObjectId, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    gender: { type: String, required: true, enum: STUDENT_GENDERS },
    studentNumber: { type: String, required: true, trim: true },
    status: { type: String, required: true, enum: STUDENT_STATUSES, default: 'ACTIVE' },
    qrToken: { type: String, required: true },
  },
  { timestamps: true, collection: 'students' },
);

studentSchema.index({ organizationId: 1, classroomId: 1 });
studentSchema.index({ organizationId: 1, studentNumber: 1 }, { unique: true });
studentSchema.index({ organizationId: 1, qrToken: 1 }, { unique: true });

export const StudentModel =
  mongoose.models.Student ?? mongoose.model<Student>('Student', studentSchema);
