import { AttendanceModel } from '../../modules/attendance/attendance.model';
import { addCalendarDays } from '../../utils/timezone';
import { JOURNEY_SCENARIOS, ROUTE_A_MORNING } from './catalog';
import { atLocal, childKey } from './seed-helpers';
import type { SeedIds } from './seed-types';

const ABSENT_TODAY = [
  JOURNEY_SCENARIOS.absent,
  childKey('amri', 'ندى'),
  childKey('shehri', 'جهاد'),
];

const MANUAL_TODAY = [
  JOURNEY_SCENARIOS.arrivedByCar,
  JOURNEY_SCENARIOS.missedThenCar,
  JOURNEY_SCENARIOS.busCancelled,
];

const STILL_ON_ROUTE = Object.values(ROUTE_A_MORNING)
  .flat()
  .filter(
    (key) => key !== JOURNEY_SCENARIOS.busCancelled && key !== JOURNEY_SCENARIOS.missedThenCar,
  );

export async function seedAttendance(ids: SeedIds): Promise<void> {
  await AttendanceModel.deleteMany({ organizationId: ids.organizationId });

  const yesterday = addCalendarDays(ids.today, -1);

  for (const student of ids.students) {
    const key = childKey(student.familyKey, student.firstName);
    const teacher = ids.teachers[student.classKey];
    const hour = 7 + (Number.parseInt(student.studentNumber.slice(-1), 10) % 2);
    const minute = 10 + (Number.parseInt(student.studentNumber.slice(-2), 10) % 40);

    if (Number.parseInt(student.studentNumber.slice(-2), 10) % 11 !== 0) {
      await AttendanceModel.create({
        organizationId: ids.organizationId,
        studentId: student.id,
        campusId: student.campusId,
        classroomId: student.classroomId,
        date: yesterday,
        attendanceType: 'PRESENT',
        scannedAt: atLocal(yesterday, hour, minute, ids.timezone),
        scannedBy: teacher,
        source: student.classKey === 'kg_b' ? 'MANUAL_BULK' : 'QR',
      });
    }

    if (STILL_ON_ROUTE.includes(key)) {
      continue;
    }

    if (ABSENT_TODAY.includes(key)) {
      await AttendanceModel.create({
        organizationId: ids.organizationId,
        studentId: student.id,
        campusId: student.campusId,
        classroomId: student.classroomId,
        date: ids.today,
        attendanceType: 'ABSENT',
        scannedAt: atLocal(ids.today, 8, 40, ids.timezone),
        scannedBy: teacher,
        source: 'MANUAL',
      });
      continue;
    }

    const source = MANUAL_TODAY.includes(key)
      ? 'MANUAL'
      : student.classKey === 'kg_b'
        ? 'MANUAL_BULK'
        : 'QR';
    const scannedAt = MANUAL_TODAY.includes(key)
      ? atLocal(ids.today, 8, 5 + (key.length % 20), ids.timezone)
      : atLocal(
          ids.today,
          7,
          35 + (Number.parseInt(student.studentNumber.slice(-2), 10) % 25),
          ids.timezone,
        );

    await AttendanceModel.create({
      organizationId: ids.organizationId,
      studentId: student.id,
      campusId: student.campusId,
      classroomId: student.classroomId,
      date: ids.today,
      attendanceType: 'PRESENT',
      scannedAt,
      scannedBy: teacher,
      source,
    });
  }
}
