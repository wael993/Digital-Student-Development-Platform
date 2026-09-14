import type { UserRole } from '../types';

export const PERMISSIONS = [
  'organizations.read',
  'organizations.update',
  'users.read',
  'users.create',
  'users.update',
  'campuses.read',
  'campuses.manage',
  'classrooms.read',
  'classrooms.manage',
  'students.read',
  'students.create',
  'students.update',
  'students.delete',
  'guardians.read',
  'guardians.manage',
  'attendance.read',
  'attendance.create',
  'student_events.read',
  'student_events.create',
  'buses.read',
  'buses.manage',
  'media.read',
  'media.create',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL: Permission[] = [...PERMISSIONS];

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  ADMIN: ALL,
  SUPERVISOR: [
    'organizations.read',
    'users.read',
    'users.create',
    'users.update',
    'campuses.read',
    'campuses.manage',
    'classrooms.read',
    'classrooms.manage',
    'students.read',
    'students.create',
    'students.update',
    'students.delete',
    'guardians.read',
    'guardians.manage',
    'attendance.read',
    'attendance.create',
    'student_events.read',
    'student_events.create',
    'buses.read',
    'buses.manage',
    'media.read',
    'media.create',
  ],
  TEACHER: [
    'organizations.read',
    'campuses.read',
    'classrooms.read',
    'students.read',
    'guardians.read',
    'attendance.read',
    'attendance.create',
    'student_events.read',
    'student_events.create',
    'media.read',
    'media.create',
  ],
  DRIVER: [
    'organizations.read',
    'campuses.read',
    'students.read',
    'student_events.read',
    'student_events.create',
    'buses.read',
  ],
  GUARDIAN: [
    'organizations.read',
    'students.read',
    'guardians.read',
    'attendance.read',
    'student_events.read',
    'media.read',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
