import mongoose, { Schema } from 'mongoose';

export const ATTENDANCE_TYPES = ['PRESENT', 'ABSENT'] as const;
export type AttendanceType = (typeof ATTENDANCE_TYPES)[number];

export const ATTENDANCE_SOURCES = ['QR'] as const;
export type AttendanceSource = (typeof ATTENDANCE_SOURCES)[number];

export interface Attendance {
  organizationId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  campusId: mongoose.Types.ObjectId;
  classroomId: mongoose.Types.ObjectId;
  date: string;
  attendanceType: AttendanceType;
  scannedAt: Date;
  scannedBy: mongoose.Types.ObjectId;
  source: AttendanceSource;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<Attendance>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    studentId: { type: Schema.Types.ObjectId, required: true },
    campusId: { type: Schema.Types.ObjectId, required: true },
    classroomId: { type: Schema.Types.ObjectId, required: true },
    date: { type: String, required: true },
    attendanceType: { type: String, required: true, enum: ATTENDANCE_TYPES },
    scannedAt: { type: Date, required: true },
    scannedBy: { type: Schema.Types.ObjectId, required: true },
    source: { type: String, required: true, enum: ATTENDANCE_SOURCES },
  },
  { timestamps: true, collection: 'attendance' },
);

attendanceSchema.index({ organizationId: 1, studentId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ organizationId: 1, studentId: 1, scannedAt: -1 });
attendanceSchema.index({ organizationId: 1, scannedAt: -1 });
attendanceSchema.index({ organizationId: 1, classroomId: 1, date: 1 });

export const AttendanceModel =
  mongoose.models.Attendance ?? mongoose.model<Attendance>('Attendance', attendanceSchema);
