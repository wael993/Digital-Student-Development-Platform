import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { tenantContext } from '../../middlewares/tenantContext';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  getUser,
  getUsers,
  patchUser,
  postDisableUser,
  postEnableUser,
  postUser,
  postUserInvitation,
} from './user.controller';

export const usersRouter = Router();

usersRouter.use(authenticate, tenantContext);

usersRouter.get('/', authorize('users.read'), asyncHandler(getUsers));
usersRouter.post('/', authorize('users.create'), asyncHandler(postUser));
usersRouter.get('/:userId', authorize('users.read'), asyncHandler(getUser));
usersRouter.patch('/:userId', authorize('users.update'), asyncHandler(patchUser));
usersRouter.post('/:userId/disable', authorize('users.update'), asyncHandler(postDisableUser));
usersRouter.post('/:userId/enable', authorize('users.update'), asyncHandler(postEnableUser));
usersRouter.post('/:userId/invitation', authorize('users.create'), asyncHandler(postUserInvitation));
