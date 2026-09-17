export type HealthStatus = 'ok';

export interface HealthResponse {
  status: HealthStatus;
}

export const TENANT_ROLES = ['ADMIN', 'SUPERVISOR', 'TEACHER', 'DRIVER', 'GUARDIAN'] as const;
export type TenantRole = (typeof TENANT_ROLES)[number];

export const PLATFORM_ROLES = ['PLATFORM_ADMIN'] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const USER_ROLES = [...TENANT_ROLES, ...PLATFORM_ROLES] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export interface PublicUser {
  id: string;
  organizationId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface AuthContext {
  userId: string;
  /**
   * Tenant users: real organization id.
   * PLATFORM_ADMIN: empty string (no tenant). requireAuth() rejects empty.
   */
  organizationId: string;
  role: UserRole;
  campusIds: string[];
  classroomIds: string[];
  routeIds: string[];
}

export function isPlatformAdmin(role: UserRole): boolean {
  return role === 'PLATFORM_ADMIN';
}

export function isTenantRole(role: UserRole): role is TenantRole {
  return (TENANT_ROLES as readonly string[]).includes(role);
}
