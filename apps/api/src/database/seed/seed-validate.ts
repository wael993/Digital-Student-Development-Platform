import { AttendanceModel } from '../../modules/attendance/attendance.model';
import { BusModel } from '../../modules/buses/bus.model';
import { BusRouteModel } from '../../modules/buses/bus-route.model';
import { BusStopModel } from '../../modules/buses/bus-stop.model';
import { DailyTransportPlanModel } from '../../modules/buses/daily-transport-plan.model';
import { calculateEta } from '../../modules/buses/eta';
import { RouteProgressModel } from '../../modules/buses/route-progress.model';
import { RouteSegmentModel } from '../../modules/buses/route-segment.model';
import { StudentTransportAssignmentModel } from '../../modules/buses/student-transport-assignment.model';
import { CampusModel } from '../../modules/campuses/campus.model';
import { ClassroomModel } from '../../modules/classrooms/classroom.model';
import { StudentGuardianModel } from '../../modules/guardians/guardian.model';
import { StudentEventModel } from '../../modules/journey/student-event.model';
import { MediaModel } from '../../modules/media/media.model';
import { DeviceTokenModel } from '../../modules/notifications/device-token.model';
import { NotificationModel } from '../../modules/notifications/notification.model';
import { StudentModel } from '../../modules/students/student.model';
import { UserModel } from '../../modules/users/user.model';
import { CAMPUSES, CLASSROOMS, ROUTE_A_STOPS, SHARED_STOPS } from './catalog';
import type { SeedIds } from './seed-types';

export async function validateSeed(ids: SeedIds): Promise<void> {
  const organizationId = ids.organizationId;
  const errors: string[] = [];
  const orgFilter = { organizationId };

  const campuses = await CampusModel.find(orgFilter);
  if (campuses.length !== 2) errors.push(`campuses ${campuses.length} !== 2`);
  for (const campus of CAMPUSES) {
    if (!campuses.some((row) => row.name === campus.name)) {
      errors.push(`missing campus ${campus.name}`);
    }
  }

  const classrooms = await ClassroomModel.find(orgFilter);
  if (classrooms.length !== 5) errors.push(`classrooms ${classrooms.length} !== 5`);
  const nakheelId = ids.campuses.nakheel;
  const nadaId = ids.campuses.nada;
  const nakheelClasses = classrooms.filter((row) => String(row.campusId) === String(nakheelId));
  const nadaClasses = classrooms.filter((row) => String(row.campusId) === String(nadaId));
  if (nakheelClasses.length !== 4) errors.push('campus 1 must have 4 classrooms');
  if (nadaClasses.length !== 1) errors.push('campus 2 must have 1 classroom');

  const students = await StudentModel.find(orgFilter);
  if (students.length !== 63) errors.push(`students ${students.length} !== 63`);
  const campus1 = students.filter((row) => String(row.campusId) === String(nakheelId));
  const campus2 = students.filter((row) => String(row.campusId) === String(nadaId));
  if (campus1.length !== 53) errors.push(`campus 1 students ${campus1.length} !== 53`);
  if (campus2.length !== 10) errors.push(`campus 2 students ${campus2.length} !== 10`);

  for (const spec of CLASSROOMS) {
    const count = students.filter(
      (row) => String(row.classroomId) === String(ids.classrooms[spec.key]),
    ).length;
    if (count !== spec.size) {
      errors.push(`${spec.key} has ${count} students, expected ${spec.size}`);
    }
  }

  const users = await UserModel.find(orgFilter);
  const teachers = users.filter((row) => row.role === 'TEACHER');
  const admins = users.filter((row) => row.role === 'ADMIN');
  const supervisors = users.filter((row) => row.role === 'SUPERVISOR');
  const drivers = users.filter((row) => row.role === 'DRIVER');
  const guardians = users.filter((row) => row.role === 'GUARDIAN');
  if (teachers.length !== 5) errors.push(`teachers ${teachers.length} !== 5`);
  if (admins.length !== 2) errors.push(`admins ${admins.length} !== 2`);
  if (supervisors.length !== 2) errors.push(`supervisors ${supervisors.length} !== 2`);
  if (drivers.length < 4) errors.push(`drivers ${drivers.length} < 4`);
  if (guardians.length < 45 || guardians.length > 55) {
    errors.push(`guardians ${guardians.length} not in 45–55`);
  }

  const names = new Map<string, string>();
  for (const person of [...users, ...students]) {
    const full = `${person.firstName} ${person.lastName}`;
    if (names.has(full)) errors.push(`duplicate full name ${full}`);
    names.set(full, full);
  }
  const emails = new Set<string>();
  for (const user of users) {
    if (emails.has(user.email)) errors.push(`duplicate email ${user.email}`);
    emails.add(user.email);
  }
  const tokens = new Set<string>();
  const numbers = new Set<string>();
  for (const student of students) {
    if (tokens.has(student.qrToken)) errors.push(`duplicate qrToken for ${student.studentNumber}`);
    tokens.add(student.qrToken);
    if (student.qrToken.length < 16) errors.push(`qrToken too short for ${student.studentNumber}`);
    if (numbers.has(student.studentNumber))
      errors.push(`duplicate studentNumber ${student.studentNumber}`);
    numbers.add(student.studentNumber);
    if (
      student.qrToken.includes(student.studentNumber) ||
      student.qrToken.includes(student.firstName) ||
      student.qrToken.includes(String(student._id))
    ) {
      errors.push(`qrToken looks like PII for ${student.studentNumber}`);
    }
  }

  const links = await StudentGuardianModel.find(orgFilter);
  const studentsWithGuardian = new Set(links.map((row) => String(row.studentId)));
  for (const student of students) {
    if (!studentsWithGuardian.has(String(student._id))) {
      errors.push(`${student.studentNumber} has no guardian`);
    }
  }
  const userIds = new Set(users.map((row) => String(row._id)));
  const studentIds = new Set(students.map((row) => String(row._id)));
  for (const link of links) {
    if (!userIds.has(String(link.userId)) || !studentIds.has(String(link.studentId))) {
      errors.push('guardian relationship points at a missing user or student');
    }
    if (String(link.organizationId) !== String(organizationId)) {
      errors.push('guardian relationship has the wrong organization');
    }
  }

  const assignments = await StudentTransportAssignmentModel.find(orgFilter);
  const routes = await BusRouteModel.find(orgFilter);
  const stops = await BusStopModel.find(orgFilter);
  const routeIds = new Set(routes.map((row) => String(row._id)));
  const stopIds = new Set(stops.map((row) => String(row._id)));
  for (const assignment of assignments) {
    if (!studentIds.has(String(assignment.studentId)))
      errors.push('assignment has invalid student');
    if (!routeIds.has(String(assignment.routeId))) errors.push('assignment has invalid route');
    if (!stopIds.has(String(assignment.stopId))) errors.push('assignment has invalid stop');
  }
  for (const stop of stops) {
    if (!routeIds.has(String(stop.routeId))) errors.push(`stop ${stop.name} has invalid route`);
  }

  const busUsers = new Set(assignments.map((row) => String(row.studentId)));
  if (busUsers.size < 40 || busUsers.size > 58) {
    errors.push(`bus-using students ${busUsers.size} is not a realistic mix`);
  }
  if (busUsers.size === students.length) {
    errors.push('every student is on a bus');
  }

  for (const name of SHARED_STOPS) {
    const shared = stops.filter((row) => row.name === name);
    const childCounts = shared.map(
      (stop) => assignments.filter((row) => String(row.stopId) === String(stop._id)).length,
    );
    if (!childCounts.some((count) => count >= 2)) {
      errors.push(`shared stop ${name} does not have multiple children`);
    }
  }

  const directions = new Set(routes.map((row) => row.direction));
  if (!directions.has('HOME_TO_SCHOOL') || !directions.has('SCHOOL_TO_HOME')) {
    errors.push('both route directions are required');
  }

  const plans = await DailyTransportPlanModel.find(orgFilter);
  for (const plan of plans) {
    if (!studentIds.has(String(plan.studentId))) errors.push('daily plan has invalid student');
  }
  if (plans.length < 3) errors.push('expected daily transport overrides');

  const events = await StudentEventModel.find(orgFilter);
  for (const event of events) {
    if (!studentIds.has(String(event.studentId))) errors.push('journey event has invalid student');
  }
  const notifications = await NotificationModel.find(orgFilter);
  for (const notification of notifications) {
    if (
      !userIds.has(String(notification.userId)) ||
      !studentIds.has(String(notification.studentId))
    ) {
      errors.push('notification has invalid user or student');
    }
  }

  const progress = await RouteProgressModel.find({
    organizationId,
    routeId: ids.routes.aMorning,
    date: ids.today,
  }).sort({ sequence: 1 });
  if (progress.length < 3) errors.push('Route A morning is not in progress');
  const current = progress[progress.length - 1];
  if (!current || current.sequence !== 3) {
    errors.push('current Route A stop should be 3');
  }

  const etaStops = stops
    .filter((row) => String(row.routeId) === String(ids.routes.aMorning))
    .map((row) => ({ id: String(row._id), sequence: row.sequence }));
  const segments = await RouteSegmentModel.find({
    organizationId,
    routeId: ids.routes.aMorning,
  });
  const eta = calculateEta({
    stops: etaStops,
    segments: segments.map((row) => ({
      fromStopId: String(row.fromStopId),
      toStopId: String(row.toStopId),
      estimatedMinutes: row.estimatedMinutes,
    })),
    currentStopSequence: 3,
    childStopSequence: 6,
  });
  if (eta.stopsRemaining !== 3 || eta.estimatedMinutes !== 11) {
    errors.push(
      `ETA for stop 6 from stop 3 should be 3 stops / 11 min, got ${eta.stopsRemaining} / ${eta.estimatedMinutes}`,
    );
  }
  const lastStop = etaStops.find((row) => row.sequence === 6);
  if (lastStop?.id && ROUTE_A_STOPS[5]) {
    const lastStopDoc = stops.find((row) => String(row._id) === lastStop.id);
    if (lastStopDoc?.name !== ROUTE_A_STOPS[5]) {
      errors.push('Route A stop 6 is not عمارة الورد');
    }
  }

  const collections: { name: string; docs: { organizationId?: { toString(): string } }[] }[] = [
    { name: 'users', docs: users },
    { name: 'students', docs: students },
    { name: 'attendance', docs: await AttendanceModel.find(orgFilter) },
    { name: 'media', docs: await MediaModel.find(orgFilter) },
    { name: 'buses', docs: await BusModel.find(orgFilter) },
    { name: 'deviceTokens', docs: await DeviceTokenModel.find(orgFilter) },
  ];
  for (const group of collections) {
    for (const doc of group.docs) {
      if (doc.organizationId && String(doc.organizationId) !== String(organizationId)) {
        errors.push(`${group.name} row belongs to another organization`);
      }
    }
  }

  if (errors.length) {
    throw new Error(`Seed validation failed:\n- ${errors.join('\n- ')}`);
  }
}
