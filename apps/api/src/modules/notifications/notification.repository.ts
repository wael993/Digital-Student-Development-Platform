import { tenantFilter, withTenant } from '../../data/tenant';
import {
  NotificationModel,
  type NotificationStatus,
  type NotificationType,
} from './notification.model';

export async function createNotification(
  organizationId: string,
  input: {
    userId: string;
    studentId: string;
    type: NotificationType;
    title: string;
    body: string;
    data: Record<string, string>;
  },
) {
  return NotificationModel.create(
    withTenant({ ...input, status: 'PENDING' satisfies NotificationStatus }, organizationId),
  );
}

export async function findNotificationById(organizationId: string, id: string) {
  return NotificationModel.findOne(tenantFilter(organizationId, { _id: id }));
}

export async function listNotifications(
  organizationId: string,
  userId: string,
  skip: number,
  limit: number,
) {
  const filter = tenantFilter(organizationId, { userId });
  const [items, total, unreadCount] = await Promise.all([
    NotificationModel.find(filter).sort({ createdAt: -1, _id: -1 }).skip(skip).limit(limit),
    NotificationModel.countDocuments(filter),
    NotificationModel.countDocuments(tenantFilter(organizationId, { userId, readAt: null })),
  ]);
  return { items, total, unreadCount };
}

export async function markNotificationRead(organizationId: string, userId: string, id: string) {
  return NotificationModel.findOneAndUpdate(
    tenantFilter(organizationId, { _id: id, userId, readAt: null }),
    { readAt: new Date(), status: 'READ' },
    { new: true },
  );
}

export async function updateNotificationStatus(
  organizationId: string,
  id: string,
  status: NotificationStatus,
  extra: { sentAt?: Date } = {},
) {
  return NotificationModel.findOneAndUpdate(
    tenantFilter(organizationId, { _id: id }),
    { status, ...extra },
    { new: true },
  );
}
