import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { catalogStudents, FAMILIES, SEED_PASSWORD } from '../src/database/seed/catalog';
import { assertSeedEnvironment } from '../src/database/seed/seed-env';
import { runSeed } from '../src/database/seed/seed';
import { BusRouteModel } from '../src/modules/buses/bus-route.model';
import { BusStopModel } from '../src/modules/buses/bus-stop.model';
import { calculateEta } from '../src/modules/buses/eta';
import { RouteProgressModel } from '../src/modules/buses/route-progress.model';
import { RouteSegmentModel } from '../src/modules/buses/route-segment.model';
import { StudentTransportAssignmentModel } from '../src/modules/buses/student-transport-assignment.model';
import { CampusModel } from '../src/modules/campuses/campus.model';
import { ClassroomModel } from '../src/modules/classrooms/classroom.model';
import { StudentGuardianModel } from '../src/modules/guardians/guardian.model';
import { StudentModel } from '../src/modules/students/student.model';
import { UserModel } from '../src/modules/users/user.model';
import { clearAuthData, connectTestDb, disconnectTestDb } from './helpers';

describe('development seed catalog', () => {
  it('has exact classroom and student counts with unique names', () => {
    const students = catalogStudents();
    expect(students).toHaveLength(63);
    expect(students.filter((row) => row.classKey === 'kg_a')).toHaveLength(20);
    expect(students.filter((row) => row.classKey === 'kg_b')).toHaveLength(18);
    expect(students.filter((row) => row.classKey === 'nursery')).toHaveLength(5);
    expect(students.filter((row) => row.classKey === 'primary')).toHaveLength(10);
    expect(students.filter((row) => row.classKey === 'kg_nada')).toHaveLength(10);
    expect(new Set(students.map((row) => `${row.firstName} ${row.lastName}`)).size).toBe(63);
    expect(FAMILIES.some((family) => family.children.length >= 3)).toBe(true);
    expect(SEED_PASSWORD).toBe('Demo@12345');
  });

  it('refuses to seed production', () => {
    expect(() => assertSeedEnvironment('production')).toThrow(/production/);
    expect(() => assertSeedEnvironment('development')).not.toThrow();
    expect(() => assertSeedEnvironment('test')).not.toThrow();
  });
});

describe('development seed dataset', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearAuthData();
  });

  it('creates the required structure and stays idempotent', async () => {
    const first = await runSeed();
    expect(first.students).toBe(63);
    expect(first.campuses).toBe(2);
    expect(first.classrooms).toBe(5);
    expect(first.teachers).toBe(5);
    expect(first.admins).toBe(2);
    expect(first.supervisors).toBe(2);
    expect(first.drivers).toBe(4);
    expect(first.guardians).toBeGreaterThanOrEqual(45);
    expect(first.guardians).toBeLessThanOrEqual(55);
    expect(first.buses).toBeGreaterThanOrEqual(3);
    expect(first.routes).toBe(6);

    const nakheel = await CampusModel.findOne({ name: 'حرم النخيل' });
    const nada = await CampusModel.findOne({ name: 'حرم الندى' });
    const organizationId = nakheel?.organizationId;
    expect(organizationId).toBeTruthy();
    const students = await StudentModel.find({ organizationId });
    expect(students.filter((row) => String(row.campusId) === String(nakheel?._id))).toHaveLength(
      53,
    );
    expect(students.filter((row) => String(row.campusId) === String(nada?._id))).toHaveLength(10);

    const classrooms = await ClassroomModel.find({ organizationId }).sort({ name: 1 });
    const byName = Object.fromEntries(classrooms.map((row) => [row.name, row]));
    expect(
      students.filter((row) => String(row.classroomId) === String(byName['روضة النخيل أ']?._id)),
    ).toHaveLength(20);

    const links = await StudentGuardianModel.find({ organizationId });
    const linked = new Set(links.map((row) => String(row.studentId)));
    expect(linked.size).toBe(63);

    const tokens = students.map((row) => row.qrToken);
    expect(new Set(tokens).size).toBe(63);

    const routeA = await BusRouteModel.findOne({
      organizationId,
      name: 'مسار النخيل أ — صباح',
    });
    expect(routeA).toBeTruthy();
    const stops = await BusStopModel.find({ organizationId, routeId: routeA!._id }).sort({
      sequence: 1,
    });
    const segments = await RouteSegmentModel.find({ organizationId, routeId: routeA!._id });
    const progress = await RouteProgressModel.find({
      organizationId,
      routeId: routeA!._id,
    }).sort({ sequence: 1 });
    expect(progress.at(-1)?.sequence).toBe(3);
    const eta = calculateEta({
      stops: stops.map((row) => ({ id: String(row._id), sequence: row.sequence })),
      segments: segments.map((row) => ({
        fromStopId: String(row.fromStopId),
        toStopId: String(row.toStopId),
        estimatedMinutes: row.estimatedMinutes,
      })),
      currentStopSequence: 3,
      childStopSequence: 6,
    });
    expect(eta).toEqual({
      currentStopSequence: 3,
      childStopSequence: 6,
      stopsRemaining: 3,
      estimatedMinutes: 11,
    });

    const rose = stops.find((row) => row.name === 'عمارة الورد');
    const roseKids = await StudentTransportAssignmentModel.countDocuments({
      organizationId,
      stopId: rose?._id,
      direction: 'HOME_TO_SCHOOL',
    });
    expect(roseKids).toBe(4);

    const busStudents = await StudentTransportAssignmentModel.distinct('studentId', {
      organizationId,
      active: true,
    });
    expect(busStudents.length).toBeGreaterThan(0);
    expect(busStudents.length).toBeLessThan(63);

    const teachers = await UserModel.countDocuments({ organizationId, role: 'TEACHER' });
    expect(teachers).toBe(5);

    const firstTokens = [...tokens].sort();
    await runSeed();
    expect(await StudentModel.countDocuments({ organizationId })).toBe(63);
    expect(await UserModel.countDocuments({ organizationId, role: 'TEACHER' })).toBe(5);
    expect(await StudentGuardianModel.distinct('studentId', { organizationId })).toHaveLength(63);
    const again = await StudentModel.find({ organizationId });
    expect(again.map((row) => row.qrToken).sort()).toEqual(firstTokens);
  });
});
