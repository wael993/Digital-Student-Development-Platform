import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { requirePlatformAdmin } from '../../middlewares/requirePlatformAdmin';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  getDashboard,
  getOrganization,
  getOrganizations,
  getSubscription,
  getUsage,
  patchOrganization,
  patchSubscription,
  postAcceptInvitation,
  postActivate,
  postAdminInvitation,
  postDeactivate,
  postOrganization,
  postSubscription,
  postSuspend,
} from './platform.controller';

export const platformRouter = Router();

// Public invitation acceptance (token is the secret).
platformRouter.post('/invitations/:token/accept', asyncHandler(postAcceptInvitation));

platformRouter.use(authenticate, requirePlatformAdmin);

platformRouter.get('/dashboard', asyncHandler(getDashboard));
platformRouter.post('/organizations', asyncHandler(postOrganization));
platformRouter.get('/organizations', asyncHandler(getOrganizations));
platformRouter.get('/organizations/:organizationId', asyncHandler(getOrganization));
platformRouter.patch('/organizations/:organizationId', asyncHandler(patchOrganization));
platformRouter.post('/organizations/:organizationId/activate', asyncHandler(postActivate));
platformRouter.post('/organizations/:organizationId/suspend', asyncHandler(postSuspend));
platformRouter.post('/organizations/:organizationId/deactivate', asyncHandler(postDeactivate));

platformRouter.get('/organizations/:organizationId/subscription', asyncHandler(getSubscription));
platformRouter.post('/organizations/:organizationId/subscription', asyncHandler(postSubscription));
platformRouter.patch('/organizations/:organizationId/subscription', asyncHandler(patchSubscription));

platformRouter.post(
  '/organizations/:organizationId/admin-invitation',
  asyncHandler(postAdminInvitation),
);

platformRouter.get('/organizations/:organizationId/usage', asyncHandler(getUsage));
