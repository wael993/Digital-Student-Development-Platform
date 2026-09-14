import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { tenantContext } from '../../middlewares/tenantContext';
import { asyncHandler } from '../../utils/asyncHandler';
import { getClassroom, getClassrooms, patchClassroom, postClassroom } from './classroom.controller';

export const classroomsRouter = Router();

classroomsRouter.use(authenticate, tenantContext);

classroomsRouter.get('/', authorize('classrooms.read'), asyncHandler(getClassrooms));
classroomsRouter.get('/:id', authorize('classrooms.read'), asyncHandler(getClassroom));
classroomsRouter.post('/', authorize('classrooms.manage'), asyncHandler(postClassroom));
classroomsRouter.patch('/:id', authorize('classrooms.manage'), asyncHandler(patchClassroom));
