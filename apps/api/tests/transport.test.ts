import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { calculateEta } from '../src/modules/buses/eta';
import { StudentEventModel } from '../src/modules/journey/student-event.model';
import { StudentTransportAssignmentModel } from '../src/modules/buses/student-transport-assignment.model';
import { NotificationModel } from '../src/modules/notifications/notification.model';
import { calendarDateInTimeZone } from '../src/utils/timezone';
import {
  clearAuthData,
  connectTestDb,
  disconnectTestDb,
  insertCampus,
  insertClassroom,
  insertOrganization,
  insertStudent,
  insertUser,
} from './helpers';

const app = createApp();
const password = 'Password123!';

async function login(email: string): Promise<string> {
  const response = await request(app).post('/api/v1/auth/login').send({ email, password });
  expect(response.status).toBe(200);
  return response.body.accessToken as string;
}

describe('ETA calculation', () => {
  it('sums remaining physical stop segments', () => {
    const stops = [
      { id: '1', sequence: 1 },
      { id: '2', sequence: 2 },
      { id: '3', sequence: 3 },
      { id: '4', sequence: 4 },
      { id: '5', sequence: 5 },
      { id: '6', sequence: 6 },
    ];
    const segments = [
      { fromStopId: '3', toStopId: '4', estimatedMinutes: 3 },
      { fromStopId: '4', toStopId: '5', estimatedMinutes: 5 },
      { fromStopId: '5', toStopId: '6', estimatedMinutes: 2 },
    ];
    expect(
      calculateEta({
        stops,
        segments,
        currentStopSequence: 3,
        childStopSequence: 6,
      }),
    ).toEqual({
      currentStopSequence: 3,
      childStopSequence: 6,
      stopsRemaining: 3,
      estimatedMinutes: 10,
    });
  });
});

describe('bus routes and transport', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await clearAuthData();
  });

  async function setup() {
    const org = await insertOrganization({ name: 'Nursery A' });
    const admin = await insertUser({
      email: 'admin.a@example.com',
      password,
      organizationId: org.id,
      role: 'ADMIN',
    });
    const campus = await insertCampus(org.id);
    const supervisor = await insertUser({
      email: 'supervisor.a@example.com',
      password,
      organizationId: org.id,
      role: 'SUPERVISOR',
      campusIds: [campus.id],
    });
    const classroom = await insertClassroom(org.id, campus.id);
    const teacher = await insertUser({
      email: 'teacher.a@example.com',
      password,
      organizationId: org.id,
      role: 'TEACHER',
      classroomIds: [classroom.id],
    });
    const driver = await insertUser({
      email: 'driver.a@example.com',
      password,
      organizationId: org.id,
      role: 'DRIVER',
    });
    const adam = await insertStudent(org.id, {
      campusId: campus.id,
      classroomId: classroom.id,
      firstName: 'Adam',
      lastName: 'A',
      studentNumber: 'A-001',
      qrToken: 'adam-qr-token-00000000000000000001',
    });
    const sara = await insertStudent(org.id, {
      campusId: campus.id,
      classroomId: classroom.id,
      firstName: 'Sara',
      lastName: 'S',
      studentNumber: 'A-002',
      qrToken: 'sara-qr-token-00000000000000000001',
    });
    const maya = await insertStudent(org.id, {
      campusId: campus.id,
      classroomId: classroom.id,
      firstName: 'Maya',
      lastName: 'M',
      studentNumber: 'A-003',
      qrToken: 'maya-qr-token-00000000000000000001',
    });
    const lina = await insertStudent(org.id, {
      campusId: campus.id,
      classroomId: classroom.id,
      firstName: 'Lina',
      lastName: 'L',
      studentNumber: 'A-004',
      qrToken: 'lina-qr-token-00000000000000000001',
    });
    return {
      org,
      campus,
      classroom,
      admin,
      supervisor,
      teacher,
      driver,
      adam,
      sara,
      maya,
      lina,
      adminToken: await login(admin.email),
      supervisorToken: await login(supervisor.email),
      teacherToken: await login(teacher.email),
      driverToken: await login(driver.email),
    };
  }

  async function createMorningRoute(token: string, campusId: string, busId?: string) {
    let id = busId;
    if (!id) {
      const bus = await request(app)
        .post('/api/v1/buses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          campusId,
          name: 'Bus 12',
          registrationNumber: 'ABC-12',
          capacity: 18,
        });
      expect(bus.status).toBe(201);
      id = bus.body.id as string;
    }
    const route = await request(app)
      .post('/api/v1/bus-routes')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Route 1', busId: id, direction: 'HOME_TO_SCHOOL' });
    expect(route.status).toBe(201);
    return { busId: id, routeId: route.body.id as string };
  }

  async function addStops(token: string, routeId: string, names: string[]) {
    const stops = [];
    for (const name of names) {
      const res = await request(app)
        .post(`/api/v1/bus-routes/${routeId}/stops`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name });
      expect(res.status).toBe(201);
      stops.push(res.body);
    }
    return stops as { id: string; sequence: number; name: string }[];
  }

  it('creates a route, ordered stops, shared stop children, and segment ETAs', async () => {
    const { adminToken, campus, adam, sara, maya, lina, driver, driverToken } = await setup();
    const bus = await request(app)
      .post('/api/v1/buses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        campusId: campus.id,
        name: 'Bus 12',
        registrationNumber: 'ABC-12',
        capacity: 18,
        driverId: driver.id,
        organizationId: 'should-be-ignored',
      });
    expect(bus.status).toBe(201);
    expect(bus.body).not.toHaveProperty('organizationId');

    const { routeId } = await createMorningRoute(adminToken, campus.id, bus.body.id);
    const stops = await addStops(adminToken, routeId, [
      'School',
      'Main Street',
      'Central Park',
      'Green Avenue',
      'River Road',
      'Oak Building',
    ]);
    expect(stops.map((stop) => stop.sequence)).toEqual([1, 2, 3, 4, 5, 6]);

    const moved = await request(app)
      .patch(`/api/v1/bus-stops/${stops[1].id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sequence: 3 });
    expect(moved.status).toBe(200);

    await request(app)
      .post(`/api/v1/bus-routes/${routeId}/students`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: adam.id, stopId: stops[5].id });
    await request(app)
      .post(`/api/v1/bus-routes/${routeId}/students`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: sara.id, stopId: stops[5].id });
    await request(app)
      .post(`/api/v1/bus-routes/${routeId}/students`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: maya.id, stopId: stops[5].id });

    const roster = await request(app)
      .get(`/api/v1/bus-routes/${routeId}/students`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(roster.status).toBe(200);
    const oak = roster.body.stops.find((stop: { name: string }) => stop.name === 'Oak Building');
    expect(oak.students.map((row: { firstName: string }) => row.firstName).sort()).toEqual([
      'Adam',
      'Maya',
      'Sara',
    ]);
    expect(roster.body.unassigned.some((row: { id: string }) => row.id === lina.id)).toBe(true);

    const listedStops = await request(app)
      .get(`/api/v1/bus-routes/${routeId}/stops`)
      .set('Authorization', `Bearer ${adminToken}`);
    const byName = new Map(
      listedStops.body.data.map((stop: { name: string; id: string }) => [stop.name, stop.id]),
    );
    await request(app)
      .patch(
        `/api/v1/bus-route-segments/${(await request(app).get(`/api/v1/bus-routes/${routeId}/segments`).set('Authorization', `Bearer ${adminToken}`)).body.data.find((s: { fromStopId: string; toStopId: string }) => s.fromStopId === byName.get('Central Park') && s.toStopId === byName.get('Green Avenue')).id}`,
      )
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ estimatedMinutes: 3 });

    const segments = await request(app)
      .get(`/api/v1/bus-routes/${routeId}/segments`)
      .set('Authorization', `Bearer ${adminToken}`);
    const parkToGreen = segments.body.data.find(
      (row: { fromStopId: string; toStopId: string }) =>
        row.fromStopId === byName.get('Central Park') &&
        row.toStopId === byName.get('Green Avenue'),
    );
    expect(parkToGreen.estimatedMinutes).toBe(3);

    await request(app)
      .post(`/api/v1/bus-routes/${routeId}/progress`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ stopId: byName.get('Central Park'), status: 'ARRIVED' });

    const progress = await request(app)
      .get(`/api/v1/bus-routes/${routeId}/progress/today`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(progress.status).toBe(200);
    expect(progress.body.liveTracking).toBe(false);
    expect(
      progress.body.stops.some(
        (stop: { name: string; status: string | null }) =>
          stop.name === 'Central Park' && stop.status === 'ARRIVED',
      ),
    ).toBe(true);
  });

  it('supports independent directions, daily overrides, and parent cancellation', async () => {
    const ctx = await setup();
    const morning = await createMorningRoute(ctx.adminToken, ctx.campus.id);
    const afternoonBus = await request(app)
      .post('/api/v1/buses')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        campusId: ctx.campus.id,
        name: 'Bus 12 PM',
        registrationNumber: 'ABC-12P',
        capacity: 18,
      });
    const afternoon = await request(app)
      .post('/api/v1/bus-routes')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        name: 'Route 1 PM',
        busId: afternoonBus.body.id,
        direction: 'SCHOOL_TO_HOME',
      });
    const morningStops = await addStops(ctx.adminToken, morning.routeId, ['Home', 'School']);
    const afternoonStops = await addStops(ctx.adminToken, afternoon.body.id, ['School', 'Home']);

    await request(app)
      .post(`/api/v1/students/${ctx.adam.id}/transport`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ routeId: morning.routeId, stopId: morningStops[0].id });
    await request(app)
      .post(`/api/v1/students/${ctx.adam.id}/transport`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ routeId: afternoon.body.id, stopId: afternoonStops[1].id });

    const assignments = await request(app)
      .get(`/api/v1/students/${ctx.adam.id}/transport`)
      .set('Authorization', `Bearer ${ctx.adminToken}`);
    expect(assignments.body.data.filter((row: { active: boolean }) => row.active)).toHaveLength(2);

    const guardian = await insertUser({
      email: 'parent.adam@example.com',
      password,
      organizationId: ctx.org.id,
      role: 'GUARDIAN',
    });
    const linked = await request(app)
      .post(`/api/v1/students/${ctx.adam.id}/guardians`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ userId: guardian.id, relationship: 'MOTHER', isPrimary: true });
    expect(linked.status).toBe(201);
    const guardianToken = await login(guardian.email);
    const today = calendarDateInTimeZone(new Date(), 'UTC');

    const cancel = await request(app)
      .post(`/api/v1/parent/children/${ctx.adam.id}/transport/cancel`)
      .set('Authorization', `Bearer ${guardianToken}`)
      .send({ direction: 'SCHOOL_TO_HOME', startDate: today, endDate: today });
    expect(cancel.status).toBe(200);

    const todayPlan = await request(app)
      .get(`/api/v1/parent/children/${ctx.adam.id}/transport/today`)
      .set('Authorization', `Bearer ${guardianToken}`);
    expect(todayPlan.status).toBe(200);
    const afternoonPlan = todayPlan.body.directions.find(
      (row: { direction: string }) => row.direction === 'SCHOOL_TO_HOME',
    );
    const morningPlan = todayPlan.body.directions.find(
      (row: { direction: string }) => row.direction === 'HOME_TO_SCHOOL',
    );
    expect(afternoonPlan.status).toBe('CANCELLED');
    expect(morningPlan.status).toBe('SCHEDULED');
    expect(afternoonPlan.transportMethod).toBe('PARENT_CAR');

    const stillAssigned = await StudentTransportAssignmentModel.find({
      studentId: ctx.adam.id,
      active: true,
    });
    expect(stillAssigned).toHaveLength(2);

    const rangeEnd = calendarDateInTimeZone(new Date(Date.now() + 2 * 86400000), 'UTC');
    const multi = await request(app)
      .post(`/api/v1/parent/children/${ctx.adam.id}/transport/cancel`)
      .set('Authorization', `Bearer ${guardianToken}`)
      .send({ direction: 'HOME_TO_SCHOOL', startDate: today, endDate: rangeEnd });
    expect(multi.status).toBe(200);
    expect(multi.body.cancellations.length).toBeGreaterThanOrEqual(3);

    const other = await insertUser({
      email: 'parent.other@example.com',
      password,
      organizationId: ctx.org.id,
      role: 'GUARDIAN',
    });
    const otherToken = await login(other.email);
    const stolen = await request(app)
      .post(`/api/v1/parent/children/${ctx.adam.id}/transport/cancel`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ direction: 'HOME_TO_SCHOOL', startDate: today, endDate: today });
    expect(stolen.status).toBe(404);
  });

  it('boards via QR, bulk-registers arrivals, and records teacher exceptions', async () => {
    const ctx = await setup();
    const bus = await request(app)
      .post('/api/v1/buses')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        campusId: ctx.campus.id,
        name: 'Bus 12',
        registrationNumber: 'ABC-12',
        capacity: 18,
        driverId: ctx.driver.id,
      });
    const { routeId } = await createMorningRoute(ctx.adminToken, ctx.campus.id, bus.body.id);
    const stops = await addStops(ctx.adminToken, routeId, ['Oak Building', 'School']);
    for (const student of [ctx.adam, ctx.sara, ctx.maya]) {
      const assigned = await request(app)
        .post(`/api/v1/bus-routes/${routeId}/students`)
        .set('Authorization', `Bearer ${ctx.adminToken}`)
        .send({ studentId: student.id, stopId: stops[0].id });
      expect(assigned.status).toBe(201);
    }

    const driverToken = await login(ctx.driver.email);
    const boarded = await request(app)
      .post('/api/v1/transport/boarding/scan')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ qrToken: ctx.adam.qrToken });
    expect(boarded.status).toBe(201);
    expect(boarded.body.eventType).toBe('BUS_BOARDING');

    const duplicate = await request(app)
      .post('/api/v1/transport/boarding/scan')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ qrToken: ctx.adam.qrToken });
    expect(duplicate.status).toBe(200);
    expect(duplicate.body.status).toBe('ALREADY_RECORDED');

    const unknown = await request(app)
      .post('/api/v1/transport/boarding/scan')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ qrToken: 'no-such-token-000000000000000000' });
    expect(unknown.status).toBe(404);

    const notOnRoute = await request(app)
      .post('/api/v1/transport/boarding/scan')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ qrToken: ctx.lina.qrToken });
    expect(notOnRoute.status).toBe(404);

    const today = calendarDateInTimeZone(new Date(), 'UTC');
    const guardian = await insertUser({
      email: 'parent.sara@example.com',
      password,
      organizationId: ctx.org.id,
      role: 'GUARDIAN',
    });
    await request(app)
      .post(`/api/v1/students/${ctx.sara.id}/guardians`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ userId: guardian.id, relationship: 'MOTHER', canPickup: true });
    const guardianToken = await login(guardian.email);
    await request(app)
      .post(`/api/v1/parent/children/${ctx.sara.id}/transport/cancel`)
      .set('Authorization', `Bearer ${guardianToken}`)
      .send({ direction: 'HOME_TO_SCHOOL', startDate: today, endDate: today });

    const bulk = await request(app)
      .post(`/api/v1/transport/routes/${routeId}/register-arrivals`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(bulk.status).toBe(200);
    const statuses = Object.fromEntries(
      bulk.body.results.map((row: { student: { id: string }; status: string }) => [
        row.student.id,
        row.status,
      ]),
    );
    expect(statuses[ctx.adam.id]).toBe('RECORDED');
    expect(statuses[ctx.maya.id]).toBe('RECORDED');
    expect(statuses[ctx.sara.id]).toBeUndefined();

    const notPresent = await request(app)
      .post(`/api/v1/students/${ctx.lina.id}/transport/arrival`)
      .set('Authorization', `Bearer ${ctx.teacherToken}`)
      .send({ status: 'NOT_PRESENT' });
    expect(notPresent.status).toBe(201);

    const car = await request(app)
      .post(`/api/v1/students/${ctx.lina.id}/transport/arrival`)
      .set('Authorization', `Bearer ${ctx.teacherToken}`)
      .send({ method: 'PARENT_CAR' });
    expect(car.status).toBe(201);

    const events = await StudentEventModel.find({ studentId: ctx.lina.id }).sort({ occurredAt: 1 });
    expect(events.map((row) => row.eventType)).toEqual([
      'NOT_PRESENT_AT_CLASS_CHECK',
      'ATTENDANCE_PRESENT',
      'ARRIVED_BY_CAR',
    ]);

    const pickup = await request(app)
      .post(`/api/v1/students/${ctx.adam.id}/transport/pickup`)
      .set('Authorization', `Bearer ${ctx.teacherToken}`)
      .send({ type: 'AUTHORIZED_PICKUP', pickupPersonId: guardian.id });
    expect(pickup.status).toBe(422);

    const adamGuardian = await insertUser({
      email: 'parent.adam2@example.com',
      password,
      organizationId: ctx.org.id,
      role: 'GUARDIAN',
    });
    await request(app)
      .post(`/api/v1/students/${ctx.adam.id}/guardians`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ userId: adamGuardian.id, relationship: 'FATHER', canPickup: true });
    const authorized = await request(app)
      .post(`/api/v1/students/${ctx.adam.id}/transport/pickup`)
      .set('Authorization', `Bearer ${ctx.teacherToken}`)
      .send({ type: 'AUTHORIZED_PICKUP', pickupPersonId: adamGuardian.id });
    expect(authorized.status).toBe(201);

    const dashboard = await request(app)
      .get(`/api/v1/transport/classroom/${ctx.classroom.id}/today`)
      .set('Authorization', `Bearer ${ctx.teacherToken}`);
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.expected).toBe(4);
  });

  it('notifies all guardians at a shared stop once and rejects cross-tenant access', async () => {
    const ctx = await setup();
    const bus = await request(app)
      .post('/api/v1/buses')
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({
        campusId: ctx.campus.id,
        name: 'Bus 12',
        registrationNumber: 'ABC-12',
        capacity: 18,
        driverId: ctx.driver.id,
      });
    const { routeId } = await createMorningRoute(ctx.adminToken, ctx.campus.id, bus.body.id);
    const stops = await addStops(ctx.adminToken, routeId, ['Stop 1', 'Oak Building']);
    for (const student of [ctx.adam, ctx.sara, ctx.maya]) {
      await request(app)
        .post(`/api/v1/bus-routes/${routeId}/students`)
        .set('Authorization', `Bearer ${ctx.adminToken}`)
        .send({ studentId: student.id, stopId: stops[1].id });
    }
    const g1 = await insertUser({
      email: 'g1@example.com',
      password,
      organizationId: ctx.org.id,
      role: 'GUARDIAN',
    });
    const g2 = await insertUser({
      email: 'g2@example.com',
      password,
      organizationId: ctx.org.id,
      role: 'GUARDIAN',
    });
    const g3 = await insertUser({
      email: 'g3@example.com',
      password,
      organizationId: ctx.org.id,
      role: 'GUARDIAN',
    });
    await request(app)
      .post(`/api/v1/students/${ctx.adam.id}/guardians`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ userId: g1.id, relationship: 'MOTHER' });
    await request(app)
      .post(`/api/v1/students/${ctx.sara.id}/guardians`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ userId: g2.id, relationship: 'FATHER' });
    await request(app)
      .post(`/api/v1/students/${ctx.maya.id}/guardians`)
      .set('Authorization', `Bearer ${ctx.adminToken}`)
      .send({ userId: g3.id, relationship: 'MOTHER' });

    const driverToken = await login(ctx.driver.email);
    await request(app)
      .post(`/api/v1/bus-routes/${routeId}/progress`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ stopId: stops[0].id, status: 'DEPARTED' });

    const notes = await NotificationModel.find({ type: 'JOURNEY_UPDATE' });
    const studentIds = notes.map((row) => String(row.studentId)).sort();
    expect(studentIds).toEqual([ctx.adam.id, ctx.maya.id, ctx.sara.id].sort());
    expect(notes.every((row) => row.title === 'Get ready')).toBe(true);
    expect(notes[0].body).toContain('Oak Building');
    expect(JSON.stringify(notes)).not.toContain('live location');

    const other = await insertOrganization({ name: 'Nursery B' });
    const otherAdmin = await insertUser({
      email: 'admin.b@example.com',
      password,
      organizationId: other.id,
      role: 'ADMIN',
    });
    const otherToken = await login(otherAdmin.email);
    const cross = await request(app)
      .get(`/api/v1/bus-routes/${routeId}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(cross.status).toBe(404);

    const eta = await request(app)
      .get(`/api/v1/parent/children/${ctx.adam.id}/transport/eta`)
      .set('Authorization', `Bearer ${await login(g1.email)}`);
    expect(eta.status).toBe(200);
    expect(eta.body.liveTracking).toBe(false);
    expect(eta.body.label).toBe('Estimated arrival');
    expect(eta.body.stopsRemaining).toBe(1);
  });
});
