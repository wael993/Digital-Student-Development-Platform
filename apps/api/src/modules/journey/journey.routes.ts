import { Router } from 'express';
import { authorize } from '../../middlewares/authorize';
import { asyncHandler } from '../../utils/asyncHandler';
import { getEvents, getTodayJourney, postEvent } from './journey.controller';

export const journeyRouter = Router();

journeyRouter.post(
  '/:studentId/events',
  authorize('student_events.create'),
  asyncHandler(postEvent),
);
journeyRouter.get('/:studentId/events', authorize('student_events.read'), asyncHandler(getEvents));
journeyRouter.get(
  '/:studentId/journey/today',
  authorize('student_events.read'),
  asyncHandler(getTodayJourney),
);
