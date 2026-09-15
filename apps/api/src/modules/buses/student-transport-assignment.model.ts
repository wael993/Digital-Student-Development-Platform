import mongoose, { Schema } from 'mongoose';
import { ROUTE_DIRECTIONS, type RouteDirection } from './bus-route.model';

export interface StudentTransportAssignment {
  organizationId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  stopId: mongoose.Types.ObjectId;
  direction: RouteDirection;
  active: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const assignmentSchema = new Schema<StudentTransportAssignment>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    studentId: { type: Schema.Types.ObjectId, required: true },
    routeId: { type: Schema.Types.ObjectId, required: true },
    stopId: { type: Schema.Types.ObjectId, required: true },
    direction: { type: String, required: true, enum: ROUTE_DIRECTIONS },
    active: { type: Boolean, required: true, default: true },
    effectiveFrom: { type: String, required: true },
    effectiveTo: { type: String },
  },
  { timestamps: true, collection: 'student_transport_assignments' },
);

assignmentSchema.index({ organizationId: 1, studentId: 1, direction: 1 });
assignmentSchema.index({ organizationId: 1, routeId: 1, stopId: 1 });

export const StudentTransportAssignmentModel =
  mongoose.models.StudentTransportAssignment ??
  mongoose.model<StudentTransportAssignment>('StudentTransportAssignment', assignmentSchema);
