import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { tenantContext } from '../../middlewares/tenantContext';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  getChildren,
  getChildMedia,
  getDashboard,
  getJourneyToday,
  rejectWrite,
} from './parent.controller';

export const parentRouter = Router();

parentRouter.use(authenticate, tenantContext);

parentRouter
  .route('/children')
  .get(authorize('students.read'), asyncHandler(getChildren))
  .all(asyncHandler(rejectWrite));

parentRouter
  .route('/children/:studentId/dashboard')
  .get(authorize('students.read'), asyncHandler(getDashboard))
  .all(asyncHandler(rejectWrite));

parentRouter
  .route('/children/:studentId/journey/today')
  .get(authorize('students.read'), asyncHandler(getJourneyToday))
  .all(asyncHandler(rejectWrite));

parentRouter
  .route('/children/:studentId/media')
  .get(authorize('media.read'), asyncHandler(getChildMedia))
  .all(asyncHandler(rejectWrite));
