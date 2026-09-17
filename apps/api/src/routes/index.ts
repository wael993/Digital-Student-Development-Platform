import { Router } from 'express';
import { attendanceRouter } from '../modules/attendance/attendance.routes';
import { authRouter } from '../modules/auth/auth.routes';
import { campusesRouter } from '../modules/campuses/campus.routes';
import { classroomsRouter } from '../modules/classrooms/classroom.routes';
import { guardiansRouter } from '../modules/guardians/guardian.routes';
import { healthRouter } from '../modules/health/health.routes';
import { organizationsRouter } from '../modules/organizations/organizations.routes';
import { parentRouter } from '../modules/parent/parent.routes';
import { mediaRouter } from '../modules/media/media.routes';
import { notificationRouter } from '../modules/notifications/notification.routes';
import { studentsRouter } from '../modules/students/student.routes';
import {
  busRouteSegmentsRouter,
  busRoutesRouter,
  busStopsRouter,
  busesRouter,
  transportRouter,
} from '../modules/buses/bus.routes';
import { platformRouter } from '../modules/platform/platform.routes';
import { usersRouter } from '../modules/users/user.routes';

export const v1Router = Router();

v1Router.use('/health', healthRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/platform', platformRouter);
v1Router.use('/organizations', organizationsRouter);
v1Router.use('/users', usersRouter);
v1Router.use('/campuses', campusesRouter);
v1Router.use('/classrooms', classroomsRouter);
v1Router.use('/students', studentsRouter);
v1Router.use('/guardians', guardiansRouter);
v1Router.use('/attendance', attendanceRouter);
v1Router.use('/parent', parentRouter);
v1Router.use('/media', mediaRouter);
v1Router.use('/notifications', notificationRouter);
v1Router.use('/buses', busesRouter);
v1Router.use('/bus-routes', busRoutesRouter);
v1Router.use('/bus-stops', busStopsRouter);
v1Router.use('/bus-route-segments', busRouteSegmentsRouter);
v1Router.use('/transport', transportRouter);
