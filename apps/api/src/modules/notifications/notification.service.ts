import type { AuthContext } from '../../types';
import { findOrganizationById } from '../organizations/organization.repository';
import { findClassroomById } from '../classrooms/classroom.repository';
import type { ClassroomLevel } from '../classrooms/classroom.model';
import { listLinksByStudentIds } from '../guardians/guardian.repository';
import { findStudentById } from '../students/student.repository';
import type { StudentEventType } from '../journey/student-event.model';
import { notFound } from '../../utils/validate';
import {
  NOTIFICATION_TYPES,
  type Notification,
  type NotificationType,
} from './notification.model';
import {
  createNotification,
  findNotificationById,
  listNotifications,
  markNotificationRead,
  updateNotificationStatus,
} from './notification.repository';
import {
  deactivateDeviceToken,
  deactivateTokensByValue,
  listActiveDeviceTokens,
  touchDeviceTokens,
  upsertDeviceToken,
} from './device-token.repository';
import { getOrCreatePreferences, updatePreferences } from './notification-preferences.repository';
import type { DevicePlatform } from './device-token.model';
import { enqueueNotificationJob, type NotificationJob } from './jobs/notification.queue';
import { sendFcm } from './fcm/fcm.service';

export const JOURNEY_NOTIFICATION_MAP: Partial<Record<StudentEventType, NotificationType>> = {
  SCHOOL_ARRIVAL: 'STUDENT_ARRIVAL',
  BUS_DEPARTURE: 'STUDENT_DEPARTURE',
  HOME_DROPOFF: 'STUDENT_HOME_DROPOFF',
};

const PREFERENCE_BY_TYPE = {
  STUDENT_ARRIVAL: 'studentArrival',
  STUDENT_DEPARTURE: 'studentDeparture',
  STUDENT_HOME_DROPOFF: 'homeDropoff',
  JOURNEY_UPDATE: 'journeyUpdates',
  MEDIA_AVAILABLE: 'mediaAvailable',
} as const;

const DATA_KEYS = new Set(['notificationId', 'type', 'studentId', 'eventId', 'mediaId']);

export function toNotificationJson(notification: Notification & { id: string }) {
  return {
    id: notification.id,
    studentId: String(notification.studentId),
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: sanitizeData(notification.data),
    status: notification.status,
    sentAt: notification.sentAt?.toISOString() ?? null,
    readAt: notification.readAt?.toISOString() ?? null,
    createdAt: notification.createdAt.toISOString(),
  };
}

export function toDeviceJson(device: {
  id: string;
  token: string;
  platform: DevicePlatform;
  deviceId: string;
  appVersion?: string;
  status: string;
  lastUsedAt: Date;
}) {
  return {
    id: device.id,
    token: device.token,
    platform: device.platform,
    deviceId: device.deviceId,
    appVersion: device.appVersion ?? null,
    status: device.status,
    lastUsedAt: device.lastUsedAt.toISOString(),
  };
}

export function toPreferencesJson(
  prefs: Awaited<ReturnType<typeof getOrCreatePreferences>>,
) {
  return {
    journeyUpdates: prefs.journeyUpdates,
    studentArrival: prefs.studentArrival,
    studentDeparture: prefs.studentDeparture,
    homeDropoff: prefs.homeDropoff,
    mediaAvailable: prefs.mediaAvailable,
  };
}

export async function registerDevice(
  auth: AuthContext,
  input: { token: string; platform: DevicePlatform; deviceId: string; appVersion?: string },
) {
  const device = await upsertDeviceToken(auth.organizationId, {
    userId: auth.userId,
    ...input,
  });
  return toDeviceJson(device as typeof device & { id: string });
}

export async function unregisterDevice(auth: AuthContext, deviceId: string) {
  const device = await deactivateDeviceToken(auth.organizationId, auth.userId, deviceId);
  if (!device) {
    throw notFound();
  }
}

export async function getPreferences(auth: AuthContext) {
  const prefs = await getOrCreatePreferences(auth.organizationId, auth.userId);
  return toPreferencesJson(prefs);
}

export async function patchPreferences(
  auth: AuthContext,
  patch: {
    journeyUpdates?: boolean;
    studentArrival?: boolean;
    studentDeparture?: boolean;
    homeDropoff?: boolean;
    mediaAvailable?: boolean;
  },
) {
  const prefs = await updatePreferences(auth.organizationId, auth.userId, patch);
  return toPreferencesJson(prefs);
}

export async function listForUser(
  auth: AuthContext,
  opts: { page: number; limit: number; skip: number },
) {
  const result = await listNotifications(auth.organizationId, auth.userId, opts.skip, opts.limit);
  return {
    data: result.items.map((item) => toNotificationJson(item as Notification & { id: string })),
    meta: { page: opts.page, limit: opts.limit, total: result.total, unreadCount: result.unreadCount },
  };
}

export async function markRead(auth: AuthContext, notificationId: string) {
  const existing = await findNotificationById(auth.organizationId, notificationId);
  if (!existing || String(existing.userId) !== auth.userId) {
    throw notFound();
  }
  if (existing.readAt) {
    return toNotificationJson(existing as Notification & { id: string });
  }
  const updated = await markNotificationRead(auth.organizationId, auth.userId, notificationId);
  if (!updated) {
    throw notFound();
  }
  return toNotificationJson(updated as Notification & { id: string });
}

export async function notifyStudentJourneyEvent(input: {
  organizationId: string;
  studentId: string;
  eventId: string;
  eventType: StudentEventType;
}): Promise<void> {
  const type = JOURNEY_NOTIFICATION_MAP[input.eventType];
  if (!type) {
    return;
  }
  const student = await findStudentById(input.organizationId, input.studentId);
  if (!student) {
    return;
  }
  const classroom = await findClassroomById(input.organizationId, String(student.classroomId));
  const place = placeLabel(classroom?.level);
  const copy = journeyCopy(type, student.firstName, place);
  await fanout({
    organizationId: input.organizationId,
    studentId: student.id,
    type,
    title: copy.title,
    body: copy.body,
    data: { type, studentId: student.id, eventId: input.eventId },
  });
}

export async function notifyMediaAvailable(input: {
  organizationId: string;
  studentId: string;
  mediaId: string;
}): Promise<void> {
  const student = await findStudentById(input.organizationId, input.studentId);
  if (!student) {
    return;
  }
  const classroom = await findClassroomById(input.organizationId, String(student.classroomId));
  const place = placeLabel(classroom?.level);
  await fanout({
    organizationId: input.organizationId,
    studentId: student.id,
    type: 'MEDIA_AVAILABLE',
    title: `New photo of ${student.firstName}`,
    body: `A new photo from ${student.firstName}'s ${place} day is available.`,
    data: { type: 'MEDIA_AVAILABLE', studentId: student.id, mediaId: input.mediaId },
  });
}

export async function deliverQueuedNotification(job: NotificationJob): Promise<void> {
  const notification = await findNotificationById(job.organizationId, job.notificationId);
  if (!notification) {
    return;
  }
  if (notification.status === 'SENT' || notification.status === 'READ') {
    return;
  }

  const devices = await listActiveDeviceTokens(job.organizationId, job.userId);
  if (devices.length === 0) {
    await updateNotificationStatus(job.organizationId, job.notificationId, 'SENT', {
      sentAt: new Date(),
    });
    return;
  }

  const data = sanitizeData({
    ...notification.data,
    notificationId: notification.id,
    type: notification.type,
    studentId: String(notification.studentId),
  });

  const result = await sendFcm({
    tokens: devices.map((device) => device.token),
    title: notification.title,
    body: notification.body,
    data,
  });

  await deactivateTokensByValue(result.invalidTokens);
  await touchDeviceTokens(job.organizationId, job.userId, result.successTokens);

  if (result.successTokens.length > 0) {
    await updateNotificationStatus(job.organizationId, job.notificationId, 'SENT', {
      sentAt: new Date(),
    });
    return;
  }
  if (result.retryableTokens.length > 0) {
    throw new Error('FCM delivery failed');
  }
  await updateNotificationStatus(
    job.organizationId,
    job.notificationId,
    result.invalidTokens.length > 0 ? 'FAILED' : 'SENT',
    result.invalidTokens.length > 0 ? {} : { sentAt: new Date() },
  );
}

export async function markNotificationFailed(organizationId: string, notificationId: string) {
  await updateNotificationStatus(organizationId, notificationId, 'FAILED');
}

async function fanout(input: {
  organizationId: string;
  studentId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, string>;
}): Promise<void> {
  const org = await findOrganizationById(input.organizationId);
  if (!org) {
    return;
  }

  const links = await listLinksByStudentIds(input.organizationId, [input.studentId]);
  const userIds = [
    ...new Set(
      links
        .filter((link) => link.receivesNotifications !== false)
        .map((link) => String(link.userId)),
    ),
  ];

  for (const userId of userIds) {
    const prefs = await getOrCreatePreferences(input.organizationId, userId);
    const flag = PREFERENCE_BY_TYPE[input.type];
    if (!prefs[flag]) {
      continue;
    }
    const notification = await createNotification(input.organizationId, {
      userId,
      studentId: input.studentId,
      type: input.type,
      title: input.title,
      body: input.body,
      data: sanitizeData(input.data),
    });
    await enqueueNotificationJob({
      notificationId: notification.id,
      organizationId: input.organizationId,
      userId,
      studentId: input.studentId,
      type: input.type,
    });
  }
}

function journeyCopy(type: NotificationType, firstName: string, place: string) {
  if (type === 'STUDENT_ARRIVAL') {
    return {
      title: `${firstName} has arrived`,
      body: `${firstName} has arrived at ${place}.`,
    };
  }
  if (type === 'STUDENT_DEPARTURE') {
    return {
      title: `${firstName} has left`,
      body: `${firstName} has left ${place}.`,
    };
  }
  return {
    title: `${firstName} has arrived home`,
    body: `${firstName} has arrived home.`,
  };
}

function placeLabel(level?: ClassroomLevel): string {
  if (level === 'NURSERY' || level === 'KINDERGARTEN') {
    return 'nursery';
  }
  return 'school';
}

function sanitizeData(data: Record<string, unknown> | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(data ?? {})) {
    if (!DATA_KEYS.has(key) || typeof value !== 'string' || value === '') {
      continue;
    }
    if (key === 'type' && !(NOTIFICATION_TYPES as readonly string[]).includes(value)) {
      continue;
    }
    out[key] = value;
  }
  return out;
}
