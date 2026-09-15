import { describe, expect, it } from 'vitest';
import { hasPermission } from '../src/authorization/permissions';
import { assertAssigned, assertSameTenant } from '../src/authorization/scope';
import { tenantFilter, withTenant } from '../src/data/tenant';
import { AppError } from '../src/utils/appError';
import type { AuthContext } from '../src/types';

const teacher: AuthContext = {
  userId: 'u1',
  organizationId: 'org-a',
  role: 'TEACHER',
  campusIds: [],
  classroomIds: [],
  routeIds: [],
};

const guardian: AuthContext = {
  userId: 'u2',
  organizationId: 'org-a',
  role: 'GUARDIAN',
  campusIds: [],
  classroomIds: [],
  routeIds: [],
};

const admin: AuthContext = {
  userId: 'u3',
  organizationId: 'org-a',
  role: 'ADMIN',
  campusIds: [],
  classroomIds: [],
  routeIds: [],
};

describe('permissions', () => {
  it('allows admins to update the organization and blocks teachers and supervisors', () => {
    expect(hasPermission('ADMIN', 'organizations.update')).toBe(true);
    expect(hasPermission('SUPERVISOR', 'organizations.update')).toBe(false);
    expect(hasPermission('TEACHER', 'organizations.update')).toBe(false);
    expect(hasPermission('GUARDIAN', 'students.read')).toBe(true);
    expect(hasPermission('GUARDIAN', 'students.create')).toBe(false);
    expect(hasPermission('GUARDIAN', 'campuses.read')).toBe(false);
    expect(hasPermission('TEACHER', 'campuses.read')).toBe(true);
    expect(hasPermission('TEACHER', 'campuses.manage')).toBe(false);
    expect(hasPermission('SUPERVISOR', 'campuses.manage')).toBe(true);
    expect(hasPermission('TEACHER', 'guardians.manage')).toBe(false);
    expect(hasPermission('ADMIN', 'guardians.manage')).toBe(true);
    expect(hasPermission('TEACHER', 'attendance.create')).toBe(true);
    expect(hasPermission('TEACHER', 'attendance.read')).toBe(true);
    expect(hasPermission('GUARDIAN', 'attendance.create')).toBe(false);
    expect(hasPermission('GUARDIAN', 'attendance.read')).toBe(true);
    expect(hasPermission('DRIVER', 'attendance.create')).toBe(false);
    expect(hasPermission('DRIVER', 'attendance.read')).toBe(false);
    expect(hasPermission('TEACHER', 'student_events.create')).toBe(true);
    expect(hasPermission('TEACHER', 'student_events.read')).toBe(true);
    expect(hasPermission('GUARDIAN', 'student_events.create')).toBe(false);
    expect(hasPermission('GUARDIAN', 'student_events.read')).toBe(true);
    expect(hasPermission('DRIVER', 'student_events.create')).toBe(true);
    expect(hasPermission('DRIVER', 'student_events.read')).toBe(true);
    expect(hasPermission('TEACHER', 'buses.read')).toBe(true);
    expect(hasPermission('TEACHER', 'buses.manage')).toBe(false);
    expect(hasPermission('DRIVER', 'buses.read')).toBe(true);
    expect(hasPermission('DRIVER', 'buses.manage')).toBe(false);
    expect(hasPermission('GUARDIAN', 'buses.read')).toBe(false);
    expect(hasPermission('TEACHER', 'media.create')).toBe(true);
    expect(hasPermission('TEACHER', 'media.read')).toBe(true);
    expect(hasPermission('TEACHER', 'media.delete')).toBe(false);
    expect(hasPermission('GUARDIAN', 'media.read')).toBe(true);
    expect(hasPermission('GUARDIAN', 'media.create')).toBe(false);
    expect(hasPermission('DRIVER', 'media.read')).toBe(false);
    expect(hasPermission('ADMIN', 'media.delete')).toBe(true);
    expect(hasPermission('SUPERVISOR', 'media.delete')).toBe(true);
    expect(hasPermission('GUARDIAN', 'notifications.read')).toBe(true);
    expect(hasPermission('GUARDIAN', 'notifications.update')).toBe(true);
    expect(hasPermission('TEACHER', 'notifications.read')).toBe(true);
  });
});

describe('tenant helpers', () => {
  it('always puts organizationId from auth into the filter', () => {
    expect(tenantFilter('org-a', { _id: 'item-1' })).toEqual({
      organizationId: 'org-a',
      _id: 'item-1',
    });
  });

  it('does not let extra overwrite the tenant key', () => {
    expect(tenantFilter('org-a', { organizationId: 'org-b', _id: 'x' })).toEqual({
      _id: 'x',
      organizationId: 'org-a',
    });
  });

  it('discards a client-supplied organizationId on write', () => {
    expect(withTenant({ name: 'Sarah', organizationId: 'org-b' }, 'org-a')).toEqual({
      name: 'Sarah',
      organizationId: 'org-a',
    });
  });
});

describe('resource-level scope', () => {
  it('hides cross-tenant ids as not found, including ObjectId-like values', () => {
    expect(() => assertSameTenant(teacher, 'org-b')).toThrow(AppError);
    try {
      assertSameTenant(teacher, 'org-b');
    } catch (err) {
      expect(err).toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
    }
    expect(() => assertSameTenant(teacher, 'org-a')).not.toThrow();
  });

  it('lets non-admins reach only assigned resources; empty list denies', () => {
    expect(() => assertAssigned(guardian, 'child-1', ['child-1'])).not.toThrow();
    expect(() => assertAssigned(guardian, 'child-3', ['child-1', 'child-2'])).toThrow(AppError);
    expect(() => assertAssigned(guardian, 'child-1', [])).toThrow(AppError);
    expect(() => assertAssigned(teacher, 'child-3', [])).toThrow(AppError);
    expect(() => assertAssigned(teacher, 'class-1', ['class-1'])).not.toThrow();
    expect(() => assertAssigned(admin, 'child-3', [])).not.toThrow();
  });
});
