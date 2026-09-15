import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { tenantContext } from '../../middlewares/tenantContext';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  deleteDevice,
  getNotifications,
  getPreferences,
  patchNotificationRead,
  patchPreferences,
  postDevice,
} from './notification.controller';

export const notificationRouter = Router();

notificationRouter.use(authenticate, tenantContext);

notificationRouter.post('/devices', authorize('notifications.update'), asyncHandler(postDevice));
notificationRouter.delete(
  '/devices/:deviceId',
  authorize('notifications.update'),
  asyncHandler(deleteDevice),
);
notificationRouter.get(
  '/preferences',
  authorize('notifications.read'),
  asyncHandler(getPreferences),
);
notificationRouter.patch(
  '/preferences',
  authorize('notifications.update'),
  asyncHandler(patchPreferences),
);
notificationRouter.get('/', authorize('notifications.read'), asyncHandler(getNotifications));
notificationRouter.patch(
  '/:notificationId/read',
  authorize('notifications.update'),
  asyncHandler(patchNotificationRead),
);
