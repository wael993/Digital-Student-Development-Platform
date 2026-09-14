import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { hashPassword } from '../src/modules/auth/auth.service';
import { RefreshTokenModel } from '../src/modules/auth/refresh-token.model';
import { OrganizationModel } from '../src/modules/organizations/organization.model';
import { createOrganization } from '../src/modules/organizations/organization.repository';
import { ScopedItemModel } from '../src/modules/tenancy/scoped-item.model';
import { createUser } from '../src/modules/users/user.repository';
import { UserModel } from '../src/modules/users/user.model';
import type { UserRole, UserStatus } from '../src/types';
import type { OrganizationStatus } from '../src/modules/organizations/organization.model';

export async function connectTestDb(): Promise<void> {
  await mongoose.connect(env.mongodbUri);
}

export async function disconnectTestDb(): Promise<void> {
  await mongoose.disconnect();
}

export async function clearAuthData(): Promise<void> {
  await UserModel.deleteMany({});
  await RefreshTokenModel.deleteMany({});
  await OrganizationModel.deleteMany({});
  await ScopedItemModel.deleteMany({});
}

export async function insertOrganization(input?: { name?: string; status?: OrganizationStatus }) {
  return createOrganization({
    name: input?.name ?? 'Nursery',
    status: input?.status ?? 'ACTIVE',
  });
}

export async function setOrganizationStatus(id: string, status: OrganizationStatus) {
  return OrganizationModel.findByIdAndUpdate(id, { status }, { new: true });
}

export async function insertUser(input: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  status?: UserStatus;
  organizationId?: string;
}) {
  const organizationId =
    input.organizationId ?? (await insertOrganization({ name: `Org ${input.email}` })).id;
  const passwordHash = await hashPassword(input.password);
  return createUser({
    organizationId,
    email: input.email,
    passwordHash,
    firstName: input.firstName ?? 'John',
    lastName: input.lastName ?? 'Smith',
    role: input.role ?? 'TEACHER',
    status: input.status ?? 'ACTIVE',
  });
}
