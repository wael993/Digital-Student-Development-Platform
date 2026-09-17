import { addCalendarDays } from '../../utils/timezone';
import { DeviceTokenModel } from '../../modules/notifications/device-token.model';
import { NotificationModel } from '../../modules/notifications/notification.model';
import { NotificationPreferencesModel } from '../../modules/notifications/notification-preferences.model';
import { DEVICE_TOKEN_EMAILS, FAMILIES, JOURNEY_SCENARIOS, PREFERENCE_USERS } from './catalog';
import { atLocal, childKey } from './seed-helpers';
import type { SeedIds } from './seed-types';

export async function seedNotifications(ids: SeedIds): Promise<void> {
  const organizationId = ids.organizationId;
  await Promise.all([
    NotificationModel.deleteMany({ organizationId }),
    DeviceTokenModel.deleteMany({ organizationId }),
    NotificationPreferencesModel.deleteMany({ organizationId }),
  ]);

  const guardianEmails = new Set<string>();
  for (const family of FAMILIES) {
    for (const person of [...family.guardians, ...(family.pickup ?? [])]) {
      guardianEmails.add(person.email);
    }
  }

  for (const email of guardianEmails) {
    const userId = ids.usersByEmail.get(email);
    if (!userId) continue;
    const mixed = email === PREFERENCE_USERS.mixedEmail;
    await NotificationPreferencesModel.create({
      organizationId,
      userId,
      journeyUpdates: !mixed,
      studentArrival: true,
      studentDeparture: !mixed,
      homeDropoff: true,
      mediaAvailable: true,
    });
  }

  const adam = ids.studentsByKey.get(JOURNEY_SCENARIOS.onRoute);
  const sara = ids.studentsByKey.get(childKey('otaibi', 'سارة'));
  const father = ids.usersByEmail.get(PREFERENCE_USERS.allOnEmail);
  const mother = ids.usersByEmail.get('noura.alshamri+guardian@demo.local');
  const mixedUser = ids.usersByEmail.get(PREFERENCE_USERS.mixedEmail);
  if (!adam || !sara || !father || !mother || !mixedUser) {
    throw new Error('Missing notification seed users');
  }

  const unread = [
    {
      type: 'JOURNEY_UPDATE' as const,
      title: 'آدم صعد الحافلة',
      body: 'آدم صعد إلى حافلة النخيل 1.',
      status: 'SENT' as const,
    },
    {
      type: 'STUDENT_ARRIVAL' as const,
      title: 'سارة وصلت',
      body: 'سارة وصلت إلى حرم النخيل.',
      status: 'SENT' as const,
    },
    {
      type: 'MEDIA_AVAILABLE' as const,
      title: 'صورة جديدة لآدم',
      body: 'تتوفر صورة جديدة من يوم آدم.',
      status: 'PENDING' as const,
    },
  ];
  for (const [index, item] of unread.entries()) {
    await NotificationModel.create({
      organizationId,
      userId: father,
      studentId: index === 1 ? sara.id : adam.id,
      type: item.type,
      title: item.title,
      body: item.body,
      data: { type: item.type, studentId: String(index === 1 ? sara.id : adam.id) },
      status: item.status,
      sentAt: item.status === 'SENT' ? atLocal(ids.today, 7, 10 + index, ids.timezone) : undefined,
    });
  }

  const yesterday = addCalendarDays(ids.today, -1);
  const history = [
    { type: 'STUDENT_ARRIVAL' as const, title: 'سارة وصلت', body: 'سارة وصلت إلى المدرسة أمس.' },
    { type: 'STUDENT_DEPARTURE' as const, title: 'سارة غادرت', body: 'سارة غادرت مع الحافلة أمس.' },
    {
      type: 'STUDENT_HOME_DROPOFF' as const,
      title: 'سارة وصلت المنزل',
      body: 'سارة وصلت إلى المنزل أمس.',
    },
    { type: 'JOURNEY_UPDATE' as const, title: 'تحديث رحلة سارة', body: 'بدأت الحصة أمس.' },
    {
      type: 'MEDIA_AVAILABLE' as const,
      title: 'صورة لسارة',
      body: 'تتوفر صورة من يوم سارة السابق.',
    },
  ];
  for (const [index, item] of history.entries()) {
    await NotificationModel.create({
      organizationId,
      userId: mother,
      studentId: sara.id,
      type: item.type,
      title: item.title,
      body: item.body,
      data: { type: item.type, studentId: String(sara.id) },
      status: 'READ',
      sentAt: atLocal(yesterday, 8 + index, 0, ids.timezone),
      readAt: atLocal(yesterday, 18, 0, ids.timezone),
    });
  }

  const yousef = ids.studentsByKey.get(JOURNEY_SCENARIOS.absent);
  if (yousef) {
    await NotificationModel.create({
      organizationId,
      userId: mixedUser,
      studentId: yousef.id,
      type: 'JOURNEY_UPDATE',
      title: 'تحديث يوسف',
      body: 'يوسف غير موجود عند التحقق الصباحي.',
      data: { type: 'JOURNEY_UPDATE', studentId: String(yousef.id) },
      status: 'SENT',
      sentAt: atLocal(ids.today, 8, 42, ids.timezone),
    });
  }

  for (const [index, email] of DEVICE_TOKEN_EMAILS.entries()) {
    const userId = ids.usersByEmail.get(email);
    if (!userId) continue;
    await DeviceTokenModel.create({
      organizationId,
      userId,
      token: `dev-fcm-token-00${index + 1}`,
      platform: index === 0 ? 'ANDROID' : 'IOS',
      appVersion: 'dev',
      deviceId: `dev-device-00${index + 1}`,
      status: 'ACTIVE',
      lastUsedAt: new Date(),
    });
  }
}
