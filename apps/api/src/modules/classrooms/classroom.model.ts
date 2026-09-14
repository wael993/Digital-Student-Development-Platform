import mongoose, { Schema } from 'mongoose';

export const CLASSROOM_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type ClassroomStatus = (typeof CLASSROOM_STATUSES)[number];

export const CLASSROOM_LEVELS = [
  'NURSERY',
  'KINDERGARTEN',
  'PRIMARY',
  'MIDDLE_SCHOOL',
  'HIGH_SCHOOL',
] as const;
export type ClassroomLevel = (typeof CLASSROOM_LEVELS)[number];

export interface Classroom {
  organizationId: mongoose.Types.ObjectId;
  campusId: mongoose.Types.ObjectId;
  name: string;
  level: ClassroomLevel;
  status: ClassroomStatus;
  teacherIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const classroomSchema = new Schema<Classroom>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    campusId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true },
    level: { type: String, required: true, enum: CLASSROOM_LEVELS },
    status: { type: String, required: true, enum: CLASSROOM_STATUSES, default: 'ACTIVE' },
    teacherIds: { type: [Schema.Types.ObjectId], required: true, default: [] },
  },
  { timestamps: true, collection: 'classrooms' },
);

classroomSchema.index({ organizationId: 1, campusId: 1 });

export const ClassroomModel =
  mongoose.models.Classroom ?? mongoose.model<Classroom>('Classroom', classroomSchema);
