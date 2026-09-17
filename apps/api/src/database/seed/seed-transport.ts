import mongoose from 'mongoose';
import { addCalendarDays } from '../../utils/timezone';
import { BusModel } from '../../modules/buses/bus.model';
import { BusRouteModel } from '../../modules/buses/bus-route.model';
import { BusStopModel } from '../../modules/buses/bus-stop.model';
import { RouteSegmentModel } from '../../modules/buses/route-segment.model';
import { StudentTransportAssignmentModel } from '../../modules/buses/student-transport-assignment.model';
import { DailyTransportPlanModel } from '../../modules/buses/daily-transport-plan.model';
import { RouteProgressModel } from '../../modules/buses/route-progress.model';
import { UserModel } from '../../modules/users/user.model';
import {
  DAILY_OVERRIDES,
  MORNING_BUS_AFTERNOON_PARENT,
  MORNING_PARENT_AFTERNOON_BUS,
  NO_BUS,
  ROUTE_A_MORNING,
  ROUTE_A_SEGMENT_MINUTES,
  ROUTE_A_STOPS,
  ROUTE_B_STOPS,
  ROUTE_C_STOPS,
} from './catalog';
import { atLocal, childKey } from './seed-helpers';
import type { SeedIds } from './seed-types';

const EFFECTIVE_FROM = '2026-09-01';

function usesMorningBus(key: string): boolean {
  return !NO_BUS.includes(key) && !MORNING_PARENT_AFTERNOON_BUS.includes(key);
}

function usesAfternoonBus(key: string): boolean {
  return !NO_BUS.includes(key) && !MORNING_BUS_AFTERNOON_PARENT.includes(key);
}

async function createStopsAndSegments(
  organizationId: mongoose.Types.ObjectId,
  routeId: mongoose.Types.ObjectId,
  names: string[],
  minutes: number[],
): Promise<Map<string, mongoose.Types.ObjectId>> {
  const byName = new Map<string, mongoose.Types.ObjectId>();
  const stopIds: mongoose.Types.ObjectId[] = [];
  for (const [index, name] of names.entries()) {
    const stop = await BusStopModel.create({
      organizationId,
      routeId,
      sequence: index + 1,
      name,
      address: name,
    });
    byName.set(name, stop._id);
    stopIds.push(stop._id);
  }
  for (let i = 0; i < stopIds.length - 1; i += 1) {
    await RouteSegmentModel.create({
      organizationId,
      routeId,
      fromStopId: stopIds[i],
      toStopId: stopIds[i + 1],
      estimatedMinutes: minutes[i] ?? 5,
    });
  }
  return byName;
}

export async function seedTransport(ids: SeedIds): Promise<void> {
  const organizationId = ids.organizationId;
  await Promise.all([
    BusModel.deleteMany({ organizationId }),
    BusRouteModel.deleteMany({ organizationId }),
    BusStopModel.deleteMany({ organizationId }),
    RouteSegmentModel.deleteMany({ organizationId }),
    StudentTransportAssignmentModel.deleteMany({ organizationId }),
    DailyTransportPlanModel.deleteMany({ organizationId }),
    RouteProgressModel.deleteMany({ organizationId }),
  ]);

  const bus1 = await BusModel.create({
    organizationId,
    campusId: ids.campuses.nakheel,
    name: 'حافلة النخيل 1',
    registrationNumber: 'نخل 4821',
    capacity: 28,
    status: 'ACTIVE',
    driverId: ids.drivers[0],
    supervisorId: ids.supervisors.nakheel,
  });
  const bus2 = await BusModel.create({
    organizationId,
    campusId: ids.campuses.nakheel,
    name: 'حافلة النخيل 2',
    registrationNumber: 'نخل 7390',
    capacity: 26,
    status: 'ACTIVE',
    driverId: ids.drivers[1],
    supervisorId: ids.supervisors.nakheel,
  });
  const bus3 = await BusModel.create({
    organizationId,
    campusId: ids.campuses.nada,
    name: 'حافلة الندى 1',
    registrationNumber: 'ندى 2156',
    capacity: 30,
    status: 'ACTIVE',
    driverId: ids.drivers[2],
    supervisorId: ids.supervisors.nada,
  });

  const aMorning = await BusRouteModel.create({
    organizationId,
    campusId: ids.campuses.nakheel,
    busId: bus1._id,
    name: 'مسار النخيل أ — صباح',
    direction: 'HOME_TO_SCHOOL',
    status: 'ACTIVE',
    estimatedStartTime: '06:45',
    estimatedEndTime: '07:35',
  });
  const aAfternoon = await BusRouteModel.create({
    organizationId,
    campusId: ids.campuses.nakheel,
    busId: bus1._id,
    name: 'مسار النخيل أ — عصر',
    direction: 'SCHOOL_TO_HOME',
    status: 'ACTIVE',
    estimatedStartTime: '13:30',
    estimatedEndTime: '14:20',
  });
  const bMorning = await BusRouteModel.create({
    organizationId,
    campusId: ids.campuses.nakheel,
    busId: bus2._id,
    name: 'مسار النخيل ب — صباح',
    direction: 'HOME_TO_SCHOOL',
    status: 'ACTIVE',
    estimatedStartTime: '06:50',
    estimatedEndTime: '07:40',
  });
  const bAfternoon = await BusRouteModel.create({
    organizationId,
    campusId: ids.campuses.nakheel,
    busId: bus2._id,
    name: 'مسار النخيل ب — عصر',
    direction: 'SCHOOL_TO_HOME',
    status: 'ACTIVE',
    estimatedStartTime: '13:35',
    estimatedEndTime: '14:25',
  });
  const cMorning = await BusRouteModel.create({
    organizationId,
    campusId: ids.campuses.nada,
    busId: bus3._id,
    name: 'مسار الندى — صباح',
    direction: 'HOME_TO_SCHOOL',
    status: 'ACTIVE',
    estimatedStartTime: '07:00',
    estimatedEndTime: '07:40',
  });
  const cAfternoon = await BusRouteModel.create({
    organizationId,
    campusId: ids.campuses.nada,
    busId: bus3._id,
    name: 'مسار الندى — عصر',
    direction: 'SCHOOL_TO_HOME',
    status: 'ACTIVE',
    estimatedStartTime: '13:20',
    estimatedEndTime: '14:00',
  });

  ids.routes = {
    aMorning: aMorning._id,
    aAfternoon: aAfternoon._id,
    bMorning: bMorning._id,
    bAfternoon: bAfternoon._id,
    cMorning: cMorning._id,
    cAfternoon: cAfternoon._id,
  };

  const aMorningStops = await createStopsAndSegments(
    organizationId,
    aMorning._id,
    ROUTE_A_STOPS,
    ROUTE_A_SEGMENT_MINUTES,
  );
  const aAfternoonStops = await createStopsAndSegments(
    organizationId,
    aAfternoon._id,
    [...ROUTE_A_STOPS].reverse(),
    [...ROUTE_A_SEGMENT_MINUTES].reverse(),
  );
  const bMorningStops = await createStopsAndSegments(
    organizationId,
    bMorning._id,
    ROUTE_B_STOPS,
    [5, 4, 6, 3],
  );
  const bAfternoonStops = await createStopsAndSegments(
    organizationId,
    bAfternoon._id,
    [...ROUTE_B_STOPS].reverse(),
    [3, 6, 4, 5],
  );
  const cMorningStops = await createStopsAndSegments(
    organizationId,
    cMorning._id,
    ROUTE_C_STOPS,
    [5, 4, 6],
  );
  const cAfternoonStops = await createStopsAndSegments(
    organizationId,
    cAfternoon._id,
    [...ROUTE_C_STOPS].reverse(),
    [6, 4, 5],
  );

  const routeAKeys = new Set(Object.values(ROUTE_A_MORNING).flat());
  const stopNameByChild = new Map<string, string>();
  for (const [stopName, children] of Object.entries(ROUTE_A_MORNING)) {
    for (const key of children) {
      stopNameByChild.set(key, stopName);
    }
  }

  async function assign(
    studentId: mongoose.Types.ObjectId,
    routeId: mongoose.Types.ObjectId,
    stopId: mongoose.Types.ObjectId,
    direction: 'HOME_TO_SCHOOL' | 'SCHOOL_TO_HOME',
  ) {
    await StudentTransportAssignmentModel.create({
      organizationId,
      studentId,
      routeId,
      stopId,
      direction,
      active: true,
      effectiveFrom: EFFECTIVE_FROM,
    });
  }

  const bMorningKids: string[] = [];
  const cMorningKids: string[] = [];
  const bAfternoonKids: string[] = [];
  const cAfternoonKids: string[] = [];

  for (const student of ids.students) {
    const key = childKey(student.familyKey, student.firstName);
    if (usesMorningBus(key)) {
      if (routeAKeys.has(key)) {
        const stopName = stopNameByChild.get(key);
        const stopId = stopName ? aMorningStops.get(stopName) : undefined;
        if (!stopId) throw new Error(`Route A stop missing for ${key}`);
        await assign(student.id, aMorning._id, stopId, 'HOME_TO_SCHOOL');
      } else if (student.campusKey === 'nada') {
        cMorningKids.push(key);
      } else {
        bMorningKids.push(key);
      }
    }
    if (usesAfternoonBus(key)) {
      if (routeAKeys.has(key) && usesMorningBus(key)) {
        const stopName = stopNameByChild.get(key);
        const stopId = stopName ? aAfternoonStops.get(stopName) : undefined;
        if (!stopId) throw new Error(`Route A afternoon stop missing for ${key}`);
        await assign(student.id, aAfternoon._id, stopId, 'SCHOOL_TO_HOME');
      } else if (student.campusKey === 'nada') {
        cAfternoonKids.push(key);
      } else if (routeAKeys.has(key)) {
        const stopName = stopNameByChild.get(key);
        const stopId = stopName ? aAfternoonStops.get(stopName) : undefined;
        if (stopId) {
          await assign(student.id, aAfternoon._id, stopId, 'SCHOOL_TO_HOME');
        }
      } else {
        bAfternoonKids.push(key);
      }
    }
  }

  async function assignRoundRobin(
    keys: string[],
    routeId: mongoose.Types.ObjectId,
    stops: Map<string, mongoose.Types.ObjectId>,
    stopNames: string[],
    direction: 'HOME_TO_SCHOOL' | 'SCHOOL_TO_HOME',
  ) {
    for (const [index, key] of keys.entries()) {
      const student = ids.studentsByKey.get(key);
      const stopId = stops.get(stopNames[index % stopNames.length]);
      if (!student || !stopId) {
        throw new Error(`Cannot assign ${key}`);
      }
      await assign(student.id, routeId, stopId, direction);
    }
  }

  await assignRoundRobin(
    bMorningKids,
    bMorning._id,
    bMorningStops,
    ROUTE_B_STOPS,
    'HOME_TO_SCHOOL',
  );
  await assignRoundRobin(
    bAfternoonKids,
    bAfternoon._id,
    bAfternoonStops,
    [...ROUTE_B_STOPS].reverse(),
    'SCHOOL_TO_HOME',
  );
  await assignRoundRobin(
    cMorningKids,
    cMorning._id,
    cMorningStops,
    ROUTE_C_STOPS,
    'HOME_TO_SCHOOL',
  );
  await assignRoundRobin(
    cAfternoonKids,
    cAfternoon._id,
    cAfternoonStops,
    [...ROUTE_C_STOPS].reverse(),
    'SCHOOL_TO_HOME',
  );

  const createdBy = ids.admins[0];
  async function cancelPlan(
    key: string,
    date: string,
    direction: 'HOME_TO_SCHOOL' | 'SCHOOL_TO_HOME',
    transportMethod: 'PARENT_CAR' | 'PARENT_PICKUP',
    reason: string,
  ) {
    const student = ids.studentsByKey.get(key);
    if (!student) throw new Error(`Missing override student ${key}`);
    await DailyTransportPlanModel.create({
      organizationId,
      studentId: student.id,
      date,
      direction,
      transportMethod,
      status: 'CANCELLED',
      reason,
      createdBy,
    });
  }

  await cancelPlan(
    DAILY_OVERRIDES.cancelMorningToday,
    ids.today,
    'HOME_TO_SCHOOL',
    'PARENT_CAR',
    'سيأتي مع ولي الأمر صباحاً',
  );
  await cancelPlan(
    DAILY_OVERRIDES.cancelAfternoonToday,
    ids.today,
    'SCHOOL_TO_HOME',
    'PARENT_PICKUP',
    'استلام مبكر من المدرسة',
  );
  for (const offset of [-1, 0, 1]) {
    await cancelPlan(
      DAILY_OVERRIDES.cancelThreeDays,
      addCalendarDays(ids.today, offset),
      'HOME_TO_SCHOOL',
      'PARENT_CAR',
      'إلغاء لثلاثة أيام متتالية',
    );
  }

  const progressStops = [
    { name: ROUTE_A_STOPS[0], status: 'DEPARTED' as const, hour: 7, minute: 5 },
    { name: ROUTE_A_STOPS[1], status: 'DEPARTED' as const, hour: 7, minute: 9 },
    { name: ROUTE_A_STOPS[2], status: 'ARRIVED' as const, hour: 7, minute: 12 },
  ];
  for (const [index, row] of progressStops.entries()) {
    const stopId = aMorningStops.get(row.name);
    if (!stopId) throw new Error(`Missing progress stop ${row.name}`);
    await RouteProgressModel.create({
      organizationId,
      routeId: aMorning._id,
      date: ids.today,
      stopId,
      sequence: index + 1,
      status: row.status,
      occurredAt: atLocal(ids.today, row.hour, row.minute, ids.timezone),
      recordedBy: ids.drivers[0],
      source: 'MANUAL',
      parentsNotified: row.status === 'DEPARTED',
    });
  }

  await UserModel.updateOne({ _id: ids.drivers[0] }, { routeIds: [aMorning._id, aAfternoon._id] });
  await UserModel.updateOne({ _id: ids.drivers[1] }, { routeIds: [bMorning._id, bAfternoon._id] });
  await UserModel.updateOne({ _id: ids.drivers[2] }, { routeIds: [cMorning._id, cAfternoon._id] });
  await UserModel.updateOne({ _id: ids.drivers[3] }, { routeIds: [] });
}
