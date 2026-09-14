export type HealthStatus = 'ok';

export interface HealthResponse {
  status: HealthStatus;
}

export const USER_ROLES = ['ADMIN', 'SUPERVISOR', 'TEACHER', 'DRIVER', 'GUARDIAN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface PublicUser {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface AuthContext {
  userId: string;
  organizationId: string;
  role: UserRole;
}
