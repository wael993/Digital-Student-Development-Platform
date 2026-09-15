import { tenantFilter, withTenant } from '../../data/tenant';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationPreferencesModel,
} from './notification-preferences.model';

export async function getOrCreatePreferences(organizationId: string, userId: string) {
  const existing = await NotificationPreferencesModel.findOne(
    tenantFilter(organizationId, { userId }),
  );
  if (existing) {
    return existing;
  }
  return NotificationPreferencesModel.create(
    withTenant({ userId, ...DEFAULT_NOTIFICATION_PREFERENCES }, organizationId),
  );
}

export async function updatePreferences(
  organizationId: string,
  userId: string,
  patch: {
    journeyUpdates?: boolean;
    studentArrival?: boolean;
    studentDeparture?: boolean;
    homeDropoff?: boolean;
    mediaAvailable?: boolean;
  },
) {
  const current = await getOrCreatePreferences(organizationId, userId);
  current.set(patch);
  return current.save();
}
