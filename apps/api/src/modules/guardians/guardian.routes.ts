import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { tenantContext } from '../../middlewares/tenantContext';
import { asyncHandler } from '../../utils/asyncHandler';
import { getGuardian, getGuardians, patchGuardian, postGuardian } from './guardian.controller';

export const guardiansRouter = Router();

guardiansRouter.use(authenticate, tenantContext);

guardiansRouter.get('/', authorize('guardians.read'), asyncHandler(getGuardians));
guardiansRouter.get('/:id', authorize('guardians.read'), asyncHandler(getGuardian));
guardiansRouter.post('/', authorize('guardians.manage'), asyncHandler(postGuardian));
guardiansRouter.patch('/:id', authorize('guardians.manage'), asyncHandler(patchGuardian));
