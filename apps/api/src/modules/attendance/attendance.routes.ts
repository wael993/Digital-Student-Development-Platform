import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { tenantContext } from '../../middlewares/tenantContext';
import { asyncHandler } from '../../utils/asyncHandler';
import { getAttendance, postScan } from './attendance.controller';

export const attendanceRouter = Router();

attendanceRouter.use(authenticate, tenantContext);

attendanceRouter.post('/scan', authorize('attendance.create'), asyncHandler(postScan));
attendanceRouter.get('/', authorize('attendance.read'), asyncHandler(getAttendance));
