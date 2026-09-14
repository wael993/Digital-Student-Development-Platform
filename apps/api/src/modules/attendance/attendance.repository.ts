import { tenantFilter, withTenant } from '../../data/tenant';
import { AttendanceModel, type AttendanceSource, type AttendanceType } from './attendance.model';

export async function findAttendanceByStudentDate(
  organizationId: string,
  studentId: string,
  date: string,
) {
  return AttendanceModel.findOne(tenantFilter(organizationId, { studentId, date }));
}

export async function createAttendance(
  organizationId: string,
  input: {
    studentId: string;
    campusId: string;
    classroomId: string;
    date: string;
    attendanceType: AttendanceType;
    scannedAt: Date;
    scannedBy: string;
    source: AttendanceSource;
  },
) {
  return AttendanceModel.create(withTenant(input, organizationId));
}

export async function listAttendance(
  organizationId: string,
  extra: Record<string, unknown>,
  skip: number,
  limit: number,
) {
  const filter = tenantFilter(organizationId, extra);
  const [items, total] = await Promise.all([
    AttendanceModel.find(filter).sort({ scannedAt: -1 }).skip(skip).limit(limit),
    AttendanceModel.countDocuments(filter),
  ]);
  return { items, total };
}
