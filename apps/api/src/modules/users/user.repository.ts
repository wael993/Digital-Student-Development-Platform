import type { UserRole, UserStatus, PublicUser } from '../../types';
import { UserModel, type User } from './user.model';

export function toPublicUser(user: User & { id: string }): PublicUser {
  return {
    id: user.id,
    organizationId: String(user.organizationId),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
  };
}

export async function findUserByEmailWithPassword(email: string) {
  return UserModel.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash');
}

export async function findUserById(id: string, organizationId: string) {
  return UserModel.findOne({ _id: id, organizationId });
}

export async function createUser(input: {
  organizationId: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status?: UserStatus;
}) {
  return UserModel.create(input);
}
