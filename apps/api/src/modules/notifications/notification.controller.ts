import type { Request, Response } from 'express';
import { requireAuth } from '../../utils/requireAuth';
import * as notificationService from './notification.service';
import {
  parseDeviceIdParam,
  parseNotificationIdParam,
  parseNotificationListQuery,
  parsePreferencePatch,
  parseRegisterDevice,
} from './notification.validation';

export async function postDevice(req: Request, res: Response): Promise<void> {
  const result = await notificationService.registerDevice(
    requireAuth(req),
    parseRegisterDevice(req.body ?? {}),
  );
  res.status(201).json(result);
}

export async function deleteDevice(req: Request, res: Response): Promise<void> {
  await notificationService.unregisterDevice(
    requireAuth(req),
    parseDeviceIdParam(req.params.deviceId),
  );
  res.status(204).send();
}

export async function getPreferences(req: Request, res: Response): Promise<void> {
  const result = await notificationService.getPreferences(requireAuth(req));
  res.status(200).json(result);
}

export async function patchPreferences(req: Request, res: Response): Promise<void> {
  const result = await notificationService.patchPreferences(
    requireAuth(req),
    parsePreferencePatch(req.body ?? {}),
  );
  res.status(200).json(result);
}

export async function getNotifications(req: Request, res: Response): Promise<void> {
  const result = await notificationService.listForUser(
    requireAuth(req),
    parseNotificationListQuery(req.query),
  );
  res.status(200).json(result);
}

export async function patchNotificationRead(req: Request, res: Response): Promise<void> {
  const result = await notificationService.markRead(
    requireAuth(req),
    parseNotificationIdParam(req.params.notificationId),
  );
  res.status(200).json(result);
}
