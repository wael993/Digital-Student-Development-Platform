import mongoose from 'mongoose';
import { env } from '../src/config/env';
import { hashPassword } from '../src/modules/auth/auth.service';
import { RefreshTokenModel } from '../src/modules/auth/refresh-token.model';
import { createUser } from '../src/modules/users/user.repository';
import { UserModel } from '../src/modules/users/user.model';
import type { UserRole, UserStatus } from '../src/types';

export async function connectTestDb(): Promise<void> {
  await mongoose.connect(env.mongodbUri);
}

export async function disconnectTestDb(): Promise<void> {
  await mongoose.disconnect();
}

export async function clearAuthData(): Promise<void> {
  await UserModel.deleteMany({});
  await RefreshTokenModel.deleteMany({});
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
  const passwordHash = await hashPassword(input.password);
  return createUser({
    organizationId: input.organizationId ?? new mongoose.Types.ObjectId().toHexString(),
    email: input.email,
    passwordHash,
    firstName: input.firstName ?? 'John',
    lastName: input.lastName ?? 'Smith',
    role: input.role ?? 'TEACHER',
    status: input.status ?? 'ACTIVE',
  });
}
