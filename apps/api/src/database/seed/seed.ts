import mongoose from 'mongoose';
import { connectMongo, disconnectMongo } from '../../config/mongodb';
import { env } from '../../config/env';
import { AttendanceModel } from '../../modules/attendance/attendance.model';
import { RefreshTokenModel } from '../../modules/auth/refresh-token.model';
import { BusModel } from '../../modules/buses/bus.model';
import { BusRouteModel } from '../../modules/buses/bus-route.model';
import { BusStopModel } from '../../modules/buses/bus-stop.model';
import { DailyTransportPlanModel } from '../../modules/buses/daily-transport-plan.model';
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
import { NotificationPreferencesModel } from '../../modules/notifications/notification-preferences.model';
import { OrganizationModel } from '../../modules/organizations/organization.model';
import { StudentModel } from '../../modules/students/student.model';
import { UserModel } from '../../modules/users/user.model';
import { calendarDateInTimeZone } from '../../utils/timezone';
import { CAMPUSES, CLASSROOMS, SEED_ORG_NAME, SEED_PASSWORD, SEED_TIMEZONE } from './catalog';
import { assertSeedEnvironment } from './seed-env';
import { seedOrganization } from './seed-organization';
import { seedCampuses } from './seed-campuses';
import { seedClassrooms } from './seed-classrooms';
import { seedUsers } from './seed-users';
import { seedStudents } from './seed-students';
import { seedGuardians } from './seed-guardians';
import { seedTransport } from './seed-transport';
import { seedAttendance } from './seed-attendance';
import { seedJourney } from './seed-journey';
import { seedNotifications } from './seed-notifications';
import { seedMedia } from './seed-media';
import { validateSeed } from './seed-validate';
import type { CampusKey, ClassKey } from './catalog';
import type { SeedIds, SeedSummary } from './seed-types';

function emptyIds(): SeedIds {
  return {
    organizationId: new mongoose.Types.ObjectId(),
    timezone: SEED_TIMEZONE,
    today: calendarDateInTimeZone(new Date(), SEED_TIMEZONE),
    campuses: {} as Record<CampusKey, mongoose.Types.ObjectId>,
    classrooms: {} as Record<ClassKey, mongoose.Types.ObjectId>,
    admins: [],
    supervisors: {} as Record<CampusKey, mongoose.Types.ObjectId>,
    teachers: {} as Record<ClassKey, mongoose.Types.ObjectId>,
    drivers: [],
    usersByEmail: new Map(),
    students: [],
    studentsByKey: new Map(),
    routes: {
      aMorning: new mongoose.Types.ObjectId(),
      aAfternoon: new mongoose.Types.ObjectId(),
      bMorning: new mongoose.Types.ObjectId(),
      bAfternoon: new mongoose.Types.ObjectId(),
      cMorning: new mongoose.Types.ObjectId(),
      cAfternoon: new mongoose.Types.ObjectId(),
    },
  };
}

export async function resetDemoData(): Promise<void> {
  assertSeedEnvironment(env.nodeEnv);
  const org = await OrganizationModel.findOne({ name: SEED_ORG_NAME });
  if (org) {
    const organizationId = org._id;
    await Promise.all([
      UserModel.deleteMany({ organizationId }),
      RefreshTokenModel.deleteMany({ organizationId }),
      CampusModel.deleteMany({ organizationId }),
      ClassroomModel.deleteMany({ organizationId }),
      StudentModel.deleteMany({ organizationId }),
      StudentGuardianModel.deleteMany({ organizationId }),
      AttendanceModel.deleteMany({ organizationId }),
      StudentEventModel.deleteMany({ organizationId }),
      MediaModel.deleteMany({ organizationId }),
      NotificationModel.deleteMany({ organizationId }),
      DeviceTokenModel.deleteMany({ organizationId }),
      NotificationPreferencesModel.deleteMany({ organizationId }),
      BusModel.deleteMany({ organizationId }),
      BusRouteModel.deleteMany({ organizationId }),
      BusStopModel.deleteMany({ organizationId }),
      RouteSegmentModel.deleteMany({ organizationId }),
      StudentTransportAssignmentModel.deleteMany({ organizationId }),
      DailyTransportPlanModel.deleteMany({ organizationId }),
      RouteProgressModel.deleteMany({ organizationId }),
    ]);
    await OrganizationModel.deleteOne({ _id: organizationId });
  }
  await UserModel.deleteMany({ email: /@demo\.local$/i });
}

export async function runSeed(): Promise<SeedSummary> {
  assertSeedEnvironment(env.nodeEnv);
  const ids = emptyIds();
  await seedOrganization(ids);
  ids.today = calendarDateInTimeZone(new Date(), ids.timezone);
  await seedCampuses(ids);
  await seedClassrooms(ids);
  await seedUsers(ids);
  await seedStudents(ids);
  await seedGuardians(ids);
  await seedTransport(ids);
  await seedAttendance(ids);
  await seedJourney(ids);
  await seedNotifications(ids);
  await seedMedia(ids);
  await validateSeed(ids);
  return collectSummary(ids);
}

async function collectSummary(ids: SeedIds): Promise<SeedSummary> {
  const organizationId = ids.organizationId;
  const [guardians, links, pickup, attendance, events, notifications, media, buses, routes, stops] =
    await Promise.all([
      UserModel.countDocuments({ organizationId, role: 'GUARDIAN' }),
      StudentGuardianModel.countDocuments({ organizationId }),
      StudentGuardianModel.countDocuments({ organizationId, relationship: 'OTHER' }),
      AttendanceModel.countDocuments({ organizationId }),
      StudentEventModel.countDocuments({ organizationId }),
      NotificationModel.countDocuments({ organizationId }),
      MediaModel.countDocuments({ organizationId }),
      BusModel.countDocuments({ organizationId }),
      BusRouteModel.countDocuments({ organizationId }),
      BusStopModel.countDocuments({ organizationId }),
    ]);
  return {
    organization: 1,
    campuses: CAMPUSES.length,
    classrooms: CLASSROOMS.length,
    students: ids.students.length,
    teachers: 5,
    admins: 2,
    supervisors: 2,
    guardians,
    drivers: ids.drivers.length,
    buses,
    routes,
    stops,
    guardianRelationships: links,
    authorizedPickupPeople: pickup,
    attendanceRecords: attendance,
    journeyEvents: events,
    notifications,
    mediaRecords: media,
  };
}

export function formatSeedSummary(summary: SeedSummary): string {
  return [
    'Seed completed successfully.',
    '',
    `Organization: ${summary.organization}`,
    '',
    `Campuses: ${summary.campuses}`,
    `Classrooms: ${summary.classrooms}`,
    '',
    `Students: ${summary.students}`,
    `Teachers: ${summary.teachers}`,
    `Admins: ${summary.admins}`,
    `Supervisors: ${summary.supervisors}`,
    `Guardians: ${summary.guardians}`,
    `Drivers: ${summary.drivers}`,
    '',
    `Buses: ${summary.buses}`,
    `Routes: ${summary.routes}`,
    `Stops: ${summary.stops}`,
    '',
    `Guardian relationships: ${summary.guardianRelationships}`,
    `Authorized pickup people: ${summary.authorizedPickupPeople}`,
    '',
    `Attendance records: ${summary.attendanceRecords}`,
    `Journey events: ${summary.journeyEvents}`,
    `Notifications: ${summary.notifications}`,
    `Media records: ${summary.mediaRecords}`,
    '',
    `Password for every user: ${SEED_PASSWORD}`,
    'Staff logins: admin.ahmad@demo.local, teacher.mariam@demo.local, supervisor.khalid@demo.local, driver.saad@demo.local',
    'Parent login: mohammed.alotaibi+guardian@demo.local (آدم and سارة)',
  ].join('\n');
}

async function main(): Promise<void> {
  assertSeedEnvironment(env.nodeEnv);
  const reset = process.argv.includes('--reset');
  await connectMongo();
  try {
    if (reset) {
      await resetDemoData();
    }
    const summary = await runSeed();
    console.log(formatSeedSummary(summary));
  } finally {
    await disconnectMongo();
  }
}

if (require.main === module) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
