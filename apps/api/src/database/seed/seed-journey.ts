import mongoose from 'mongoose';
import { AttendanceModel } from '../../modules/attendance/attendance.model';
import {
  StudentEventModel,
  type StudentEventSource,
  type StudentEventType,
} from '../../modules/journey/student-event.model';
import { addCalendarDays } from '../../utils/timezone';
import { JOURNEY_SCENARIOS, ROUTE_A_MORNING } from './catalog';
import { atLocal, childKey } from './seed-helpers';
import type { SeedIds } from './seed-types';

type EventRow = {
  eventType: StudentEventType;
  occurredAt: Date;
  recordedBy: mongoose.Types.ObjectId;
  source: StudentEventSource;
  metadata?: Record<string, unknown>;
};

const ROUTE_A_BOARDED = new Set([
  ...(ROUTE_A_MORNING['حي الربيع'] ?? []),
  ...(ROUTE_A_MORNING['برج الياسمين'] ?? []),
]);

function row(
  eventType: StudentEventType,
  occurredAt: Date,
  recordedBy: mongoose.Types.ObjectId,
  source: StudentEventSource = 'MANUAL',
  metadata: Record<string, unknown> = {},
): EventRow {
  return { eventType, occurredAt, recordedBy, source, metadata };
}

export async function seedJourney(ids: SeedIds): Promise<void> {
  await StudentEventModel.deleteMany({ organizationId: ids.organizationId });
  const yesterday = addCalendarDays(ids.today, -1);
  const docs: Record<string, unknown>[] = [];
  const attendanceRows = await AttendanceModel.find({ organizationId: ids.organizationId });
  const attendanceByKey = new Map(
    attendanceRows.map((row) => [`${String(row.studentId)}:${row.date}`, row]),
  );

  for (const student of ids.students) {
    const key = childKey(student.familyKey, student.firstName);
    const teacher = ids.teachers[student.classKey];
    const driver =
      student.campusKey === 'nada'
        ? ids.drivers[2]
        : ids.drivers[student.classKey === 'kg_a' ? 0 : 1];
    const index = Number.parseInt(student.studentNumber.slice(-2), 10);
    const yesterdayAttendance = attendanceByKey.get(`${String(student.id)}:${yesterday}`);

    if (yesterdayAttendance?.attendanceType === 'PRESENT' && index % 3 !== 0) {
      const t = (h: number, m: number) => atLocal(yesterday, h, m, ids.timezone);
      docs.push(
        ...[
          row(
            'ATTENDANCE_PRESENT',
            yesterdayAttendance.scannedAt,
            yesterdayAttendance.scannedBy,
            yesterdayAttendance.source,
            { attendanceId: String(yesterdayAttendance._id) },
          ),
          row('SCHOOL_ARRIVAL', t(7, 50), teacher),
          row('CLASS_STARTED', t(8, 5), teacher),
          ...(index % 2 === 0 ? [row('BREAK_STARTED', t(10, 15), teacher)] : []),
          ...(index % 4 === 0 ? [row('ACTIVITY_STARTED', t(10, 45), teacher)] : []),
          ...(index % 5 === 0 ? [row('MEAL', t(12, 0), teacher)] : []),
          ...(index % 6 === 0 ? [row('SKILL_SESSION', t(13, 10), teacher)] : []),
          ...(index % 7 === 0
            ? [row('BUS_DEPARTURE', t(13, 35), driver), row('HOME_DROPOFF', t(14, 10), driver)]
            : index % 8 === 0
              ? [row('PARENT_PICKUP', t(13, 20), teacher)]
              : index % 9 === 0
                ? [row('AUTHORIZED_PICKUP', t(13, 25), teacher)]
                : []),
        ].map((event) => toDoc(ids, student.id, event)),
      );
    }

    const todayAttendance = attendanceByKey.get(`${String(student.id)}:${ids.today}`);
    const t = (h: number, m: number) => atLocal(ids.today, h, m, ids.timezone);

    if (key === JOURNEY_SCENARIOS.onRoute || ROUTE_A_BOARDED.has(key)) {
      docs.push(
        toDoc(ids, student.id, row('BUS_BOARDING', t(7, 8 + (index % 5)), ids.drivers[0], 'QR')),
      );
      continue;
    }

    if (key === JOURNEY_SCENARIOS.absent) {
      docs.push(toDoc(ids, student.id, row('NOT_PRESENT_AT_CLASS_CHECK', t(8, 40), teacher)));
      continue;
    }

    if (key === JOURNEY_SCENARIOS.arrivedByCar) {
      if (todayAttendance) {
        docs.push(
          toDoc(
            ids,
            student.id,
            row(
              'ATTENDANCE_PRESENT',
              todayAttendance.scannedAt,
              todayAttendance.scannedBy,
              todayAttendance.source,
              { attendanceId: String(todayAttendance._id) },
            ),
          ),
        );
      }
      docs.push(toDoc(ids, student.id, row('ARRIVED_BY_CAR', t(8, 10), teacher)));
      continue;
    }

    if (key === JOURNEY_SCENARIOS.missedThenCar) {
      docs.push(toDoc(ids, student.id, row('MISSED_BUS', t(7, 20), ids.drivers[0], 'MANUAL')));
      if (todayAttendance) {
        docs.push(
          toDoc(
            ids,
            student.id,
            row(
              'ATTENDANCE_PRESENT',
              todayAttendance.scannedAt,
              todayAttendance.scannedBy,
              todayAttendance.source,
              { attendanceId: String(todayAttendance._id) },
            ),
          ),
        );
      }
      docs.push(toDoc(ids, student.id, row('ARRIVED_BY_CAR', t(8, 15), teacher)));
      continue;
    }

    if (key === JOURNEY_SCENARIOS.busCancelled) {
      docs.push(
        toDoc(ids, student.id, row('TRANSPORT_CANCELLED', t(6, 40), ids.admins[0], 'SYSTEM')),
      );
      if (todayAttendance) {
        docs.push(
          toDoc(
            ids,
            student.id,
            row(
              'ATTENDANCE_PRESENT',
              todayAttendance.scannedAt,
              todayAttendance.scannedBy,
              todayAttendance.source,
              { attendanceId: String(todayAttendance._id) },
            ),
          ),
        );
      }
      docs.push(toDoc(ids, student.id, row('ARRIVED_BY_CAR', t(8, 0), teacher)));
      continue;
    }

    if (todayAttendance?.attendanceType === 'ABSENT') {
      docs.push(toDoc(ids, student.id, row('NOT_PRESENT_AT_CLASS_CHECK', t(8, 42), teacher)));
      continue;
    }

    if (todayAttendance?.attendanceType === 'PRESENT') {
      docs.push(
        toDoc(
          ids,
          student.id,
          row(
            'ATTENDANCE_PRESENT',
            todayAttendance.scannedAt,
            todayAttendance.scannedBy,
            todayAttendance.source,
            { attendanceId: String(todayAttendance._id) },
          ),
        ),
      );
    }

    if (key === JOURNEY_SCENARIOS.atSchool) {
      docs.push(
        toDoc(ids, student.id, row('BUS_BOARDING', t(7, 5), ids.drivers[1], 'QR')),
        toDoc(ids, student.id, row('SCHOOL_ARRIVAL', t(7, 42), teacher)),
        toDoc(ids, student.id, row('CLASS_STARTED', t(8, 0), teacher)),
        toDoc(ids, student.id, row('BREAK_STARTED', t(10, 10), teacher)),
      );
      continue;
    }

    if (key === JOURNEY_SCENARIOS.afternoonBusExpected) {
      docs.push(
        toDoc(ids, student.id, row('BUS_BOARDING', t(7, 8), ids.drivers[1], 'QR')),
        toDoc(ids, student.id, row('SCHOOL_ARRIVAL', t(7, 45), teacher)),
        toDoc(ids, student.id, row('CLASS_STARTED', t(8, 5), teacher)),
        toDoc(ids, student.id, row('ACTIVITY_STARTED', t(9, 30), teacher)),
        toDoc(ids, student.id, row('MEAL', t(12, 0), teacher)),
      );
      continue;
    }

    if (key === JOURNEY_SCENARIOS.parentPickup) {
      docs.push(
        toDoc(ids, student.id, row('SCHOOL_ARRIVAL', t(7, 50), teacher)),
        toDoc(ids, student.id, row('CLASS_STARTED', t(8, 5), teacher)),
        toDoc(ids, student.id, row('PARENT_PICKUP', t(11, 40), teacher)),
      );
      continue;
    }

    if (key === JOURNEY_SCENARIOS.authorizedPickup) {
      docs.push(
        toDoc(ids, student.id, row('SCHOOL_ARRIVAL', t(7, 48), teacher)),
        toDoc(ids, student.id, row('CLASS_STARTED', t(8, 4), teacher)),
        toDoc(ids, student.id, row('SKILL_SESSION', t(10, 0), teacher)),
        toDoc(ids, student.id, row('AUTHORIZED_PICKUP', t(12, 10), teacher)),
      );
      continue;
    }

    if (todayAttendance?.attendanceType === 'PRESENT' && index % 2 === 0) {
      docs.push(toDoc(ids, student.id, row('SCHOOL_ARRIVAL', t(7, 55), teacher)));
      if (index % 4 === 0) {
        docs.push(toDoc(ids, student.id, row('CLASS_STARTED', t(8, 10), teacher)));
      }
    }
  }

  if (docs.length) {
    await StudentEventModel.insertMany(docs);
  }
}

function toDoc(
  ids: SeedIds,
  studentId: mongoose.Types.ObjectId,
  event: EventRow,
): Record<string, unknown> {
  return {
    organizationId: ids.organizationId,
    studentId,
    eventType: event.eventType,
    occurredAt: event.occurredAt,
    recordedAt: event.occurredAt,
    recordedBy: event.recordedBy,
    source: event.source,
    metadata: event.metadata ?? {},
  };
}
