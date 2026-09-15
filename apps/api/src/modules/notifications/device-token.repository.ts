import { tenantFilter, withTenant } from '../../data/tenant';
import {
  DeviceTokenModel,
  type DevicePlatform,
  type DeviceTokenStatus,
} from './device-token.model';

export async function upsertDeviceToken(
  organizationId: string,
  input: {
    userId: string;
    token: string;
    platform: DevicePlatform;
    deviceId: string;
    appVersion?: string;
  },
) {
  const now = new Date();
  const existingToken = await DeviceTokenModel.findOne({ token: input.token });
  if (existingToken) {
    existingToken.set({
      organizationId,
      userId: input.userId,
      platform: input.platform,
      deviceId: input.deviceId,
      appVersion: input.appVersion,
      status: 'ACTIVE' satisfies DeviceTokenStatus,
      lastUsedAt: now,
    });
    return existingToken.save();
  }

  const existingDevice = await DeviceTokenModel.findOne(
    tenantFilter(organizationId, { userId: input.userId, deviceId: input.deviceId }),
  );
  if (existingDevice) {
    existingDevice.token = input.token;
    existingDevice.platform = input.platform;
    existingDevice.appVersion = input.appVersion;
    existingDevice.status = 'ACTIVE';
    existingDevice.lastUsedAt = now;
    return existingDevice.save();
  }

  return DeviceTokenModel.create(
    withTenant(
      {
        ...input,
        status: 'ACTIVE' satisfies DeviceTokenStatus,
        lastUsedAt: now,
      },
      organizationId,
    ),
  );
}

export async function listActiveDeviceTokens(organizationId: string, userId: string) {
  return DeviceTokenModel.find(
    tenantFilter(organizationId, { userId, status: 'ACTIVE' }),
  );
}

export async function deactivateDeviceToken(
  organizationId: string,
  userId: string,
  deviceId: string,
) {
  return DeviceTokenModel.findOneAndUpdate(
    tenantFilter(organizationId, { userId, deviceId, status: 'ACTIVE' }),
    { status: 'INACTIVE' },
    { new: true },
  );
}

export async function deactivateTokensByValue(tokens: string[]) {
  if (tokens.length === 0) {
    return;
  }
  await DeviceTokenModel.updateMany({ token: { $in: tokens } }, { status: 'INACTIVE' });
}

export async function touchDeviceTokens(organizationId: string, userId: string, tokens: string[]) {
  if (tokens.length === 0) {
    return;
  }
  await DeviceTokenModel.updateMany(
    tenantFilter(organizationId, { userId, token: { $in: tokens }, status: 'ACTIVE' }),
    { lastUsedAt: new Date() },
  );
}
