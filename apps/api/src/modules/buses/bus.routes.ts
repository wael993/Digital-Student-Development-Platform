import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { tenantContext } from '../../middlewares/tenantContext';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  deleteRouteStudent,
  deleteStop,
  getBus,
  getBuses,
  getClassroomToday,
  getProgressToday,
  getRoute,
  getRoutes,
  getRouteStudents,
  getSegments,
  getStops,
  patchBus,
  patchRoute,
  patchSegment,
  patchStop,
  postBoardingScan,
  postBus,
  postProgress,
  postRegisterArrivals,
  postRoute,
  postRouteStudent,
  postSegment,
  postStop,
} from './bus.controller';

export const busesRouter = Router();
busesRouter.use(authenticate, tenantContext);
busesRouter.post('/', authorize('buses.manage'), asyncHandler(postBus));
busesRouter.get('/', authorize('buses.read'), asyncHandler(getBuses));
busesRouter.get('/:busId', authorize('buses.read'), asyncHandler(getBus));
busesRouter.patch('/:busId', authorize('buses.manage'), asyncHandler(patchBus));

export const busRoutesRouter = Router();
busRoutesRouter.use(authenticate, tenantContext);
busRoutesRouter.post('/', authorize('buses.manage'), asyncHandler(postRoute));
busRoutesRouter.get('/', authorize('buses.read'), asyncHandler(getRoutes));
busRoutesRouter.get('/:routeId', authorize('buses.read'), asyncHandler(getRoute));
busRoutesRouter.patch('/:routeId', authorize('buses.manage'), asyncHandler(patchRoute));
busRoutesRouter.post('/:routeId/stops', authorize('buses.manage'), asyncHandler(postStop));
busRoutesRouter.get('/:routeId/stops', authorize('buses.read'), asyncHandler(getStops));
busRoutesRouter.post('/:routeId/segments', authorize('buses.manage'), asyncHandler(postSegment));
busRoutesRouter.get('/:routeId/segments', authorize('buses.read'), asyncHandler(getSegments));
busRoutesRouter.get('/:routeId/students', authorize('buses.read'), asyncHandler(getRouteStudents));
busRoutesRouter.post(
  '/:routeId/students',
  authorize('buses.manage'),
  asyncHandler(postRouteStudent),
);
busRoutesRouter.delete(
  '/:routeId/students/:studentId',
  authorize('buses.manage'),
  asyncHandler(deleteRouteStudent),
);
busRoutesRouter.post('/:routeId/progress', authorize('buses.read'), asyncHandler(postProgress));
busRoutesRouter.get(
  '/:routeId/progress/today',
  authorize('buses.read'),
  asyncHandler(getProgressToday),
);

export const busStopsRouter = Router();
busStopsRouter.use(authenticate, tenantContext);
busStopsRouter.patch('/:stopId', authorize('buses.manage'), asyncHandler(patchStop));
busStopsRouter.delete('/:stopId', authorize('buses.manage'), asyncHandler(deleteStop));

export const busRouteSegmentsRouter = Router();
busRouteSegmentsRouter.use(authenticate, tenantContext);
busRouteSegmentsRouter.patch('/:segmentId', authorize('buses.manage'), asyncHandler(patchSegment));

export const transportRouter = Router();
transportRouter.use(authenticate, tenantContext);
transportRouter.post(
  '/boarding/scan',
  authorize('student_events.create'),
  asyncHandler(postBoardingScan),
);
transportRouter.post(
  '/routes/:routeId/register-arrivals',
  authorize('student_events.create'),
  asyncHandler(postRegisterArrivals),
);
transportRouter.get(
  '/classroom/:classroomId/today',
  authorize('students.read'),
  asyncHandler(getClassroomToday),
);
