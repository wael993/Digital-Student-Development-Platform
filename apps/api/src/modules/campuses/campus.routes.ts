import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { tenantContext } from '../../middlewares/tenantContext';
import { asyncHandler } from '../../utils/asyncHandler';
import { getCampus, getCampuses, patchCampus, postCampus } from './campus.controller';

export const campusesRouter = Router();

campusesRouter.use(authenticate, tenantContext);

campusesRouter.get('/', authorize('campuses.read'), asyncHandler(getCampuses));
campusesRouter.get('/:id', authorize('campuses.read'), asyncHandler(getCampus));
campusesRouter.post('/', authorize('campuses.manage'), asyncHandler(postCampus));
campusesRouter.patch('/:id', authorize('campuses.manage'), asyncHandler(patchCampus));
