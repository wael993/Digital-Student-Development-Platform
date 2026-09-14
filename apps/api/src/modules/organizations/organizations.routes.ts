import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { tenantContext } from '../../middlewares/tenantContext';
import { asyncHandler } from '../../utils/asyncHandler';
import { getCurrentOrganization, patchCurrentOrganization } from './organizations.controller';

export const organizationsRouter = Router();

organizationsRouter.get(
  '/current',
  authenticate,
  tenantContext,
  authorize('organizations.read'),
  asyncHandler(getCurrentOrganization),
);

organizationsRouter.patch(
  '/current',
  authenticate,
  tenantContext,
  authorize('organizations.update'),
  asyncHandler(patchCurrentOrganization),
);
