import mongoose, { Schema } from 'mongoose';

export const STUDENT_EVENT_TYPES = [
  'ATTENDANCE_PRESENT',
  'BUS_BOARDING',
  'SCHOOL_ARRIVAL',
  'CLASS_STARTED',
  'BREAK_STARTED',
  'ACTIVITY_STARTED',
  'MEAL',
  'SKILL_SESSION',
  'BUS_DEPARTURE',
  'HOME_DROPOFF',
] as const;
export type StudentEventType = (typeof STUDENT_EVENT_TYPES)[number];

export const STUDENT_EVENT_SOURCES = ['MANUAL', 'QR', 'SYSTEM'] as const;
export type StudentEventSource = (typeof STUDENT_EVENT_SOURCES)[number];

export const CLASS_EVENT_TYPES: readonly StudentEventType[] = [
  'SCHOOL_ARRIVAL',
  'CLASS_STARTED',
  'BREAK_STARTED',
  'ACTIVITY_STARTED',
  'MEAL',
  'SKILL_SESSION',
];

export const TRANSPORT_EVENT_TYPES: readonly StudentEventType[] = [
  'BUS_BOARDING',
  'BUS_DEPARTURE',
  'HOME_DROPOFF',
];

export interface StudentEvent {
  organizationId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  eventType: StudentEventType;
  occurredAt: Date;
  recordedAt: Date;
  recordedBy: mongoose.Types.ObjectId;
  source: StudentEventSource;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const studentEventSchema = new Schema<StudentEvent>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    studentId: { type: Schema.Types.ObjectId, required: true },
    eventType: { type: String, required: true, enum: STUDENT_EVENT_TYPES },
    occurredAt: { type: Date, required: true },
    recordedAt: { type: Date, required: true },
    recordedBy: { type: Schema.Types.ObjectId, required: true },
    source: { type: String, required: true, enum: STUDENT_EVENT_SOURCES },
    metadata: { type: Schema.Types.Mixed, required: true, default: {} },
  },
  { timestamps: true, collection: 'student_events' },
);

studentEventSchema.index({ organizationId: 1, studentId: 1, occurredAt: -1 });
studentEventSchema.index({ organizationId: 1, studentId: 1, eventType: 1, occurredAt: -1 });

export const StudentEventModel =
  mongoose.models.StudentEvent ?? mongoose.model<StudentEvent>('StudentEvent', studentEventSchema);
