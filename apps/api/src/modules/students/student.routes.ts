import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { tenantContext } from '../../middlewares/tenantContext';
import { asyncHandler } from '../../utils/asyncHandler';
import { journeyRouter } from '../journey/journey.routes';
import {
  deleteStudentGuardian,
  getStudent,
  getStudentGuardians,
  getStudents,
  patchStudent,
  postStudent,
  postStudentGuardian,
} from './student.controller';

export const studentsRouter = Router();

studentsRouter.use(authenticate, tenantContext);
studentsRouter.use(journeyRouter);

studentsRouter.get('/', authorize('students.read'), asyncHandler(getStudents));
studentsRouter.get('/:id', authorize('students.read'), asyncHandler(getStudent));
studentsRouter.post('/', authorize('students.create'), asyncHandler(postStudent));
studentsRouter.patch('/:id', authorize('students.update'), asyncHandler(patchStudent));

studentsRouter.get(
  '/:id/guardians',
  authorize('guardians.read'),
  asyncHandler(getStudentGuardians),
);
studentsRouter.post(
  '/:id/guardians',
  authorize('guardians.manage'),
  asyncHandler(postStudentGuardian),
);
studentsRouter.delete(
  '/:id/guardians/:userId',
  authorize('guardians.manage'),
  asyncHandler(deleteStudentGuardian),
);
