import { Router } from 'express';
import { attendanceRouter } from '../modules/attendance/attendance.routes';
import { authRouter } from '../modules/auth/auth.routes';
import { campusesRouter } from '../modules/campuses/campus.routes';
import { classroomsRouter } from '../modules/classrooms/classroom.routes';
import { guardiansRouter } from '../modules/guardians/guardian.routes';
import { healthRouter } from '../modules/health/health.routes';
import { organizationsRouter } from '../modules/organizations/organizations.routes';
import { parentRouter } from '../modules/parent/parent.routes';
import { studentsRouter } from '../modules/students/student.routes';

export const v1Router = Router();

v1Router.use('/health', healthRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/organizations', organizationsRouter);
v1Router.use('/campuses', campusesRouter);
v1Router.use('/classrooms', classroomsRouter);
v1Router.use('/students', studentsRouter);
v1Router.use('/guardians', guardiansRouter);
v1Router.use('/attendance', attendanceRouter);
v1Router.use('/parent', parentRouter);
