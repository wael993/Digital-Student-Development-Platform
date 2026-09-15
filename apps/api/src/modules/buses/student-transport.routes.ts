import { Router } from 'express';
import { authorize } from '../../middlewares/authorize';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  deleteStudentTransport,
  getStudentTransport,
  getStudentTransportToday,
  patchStudentTransport,
  patchStudentTransportToday,
  postArrival,
  postPickup,
  postStudentTransport,
} from './bus.controller';

export const studentTransportRouter = Router();

studentTransportRouter.get(
  '/:studentId/transport/today',
  authorize('students.read'),
  asyncHandler(getStudentTransportToday),
);
studentTransportRouter.patch(
  '/:studentId/transport/today',
  authorize('student_events.create'),
  asyncHandler(patchStudentTransportToday),
);
studentTransportRouter.post(
  '/:studentId/transport/arrival',
  authorize('student_events.create'),
  asyncHandler(postArrival),
);
studentTransportRouter.post(
  '/:studentId/transport/pickup',
  authorize('student_events.create'),
  asyncHandler(postPickup),
);
studentTransportRouter.post(
  '/:studentId/transport',
  authorize('buses.manage'),
  asyncHandler(postStudentTransport),
);
studentTransportRouter.get(
  '/:studentId/transport',
  authorize('students.read'),
  asyncHandler(getStudentTransport),
);
studentTransportRouter.patch(
  '/:studentId/transport/:assignmentId',
  authorize('buses.manage'),
  asyncHandler(patchStudentTransport),
);
studentTransportRouter.delete(
  '/:studentId/transport/:assignmentId',
  authorize('buses.manage'),
  asyncHandler(deleteStudentTransport),
);
