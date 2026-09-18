import type { Request } from 'express';
import type { AuthContext } from '../../types';
import { AppError } from '../../utils/appError';
import { isValidTimeZone } from '../../utils/timezone';
import {
  asTrimmedString,
  optionalEnum,
  optionalString,
  parsePagination,
  requireEnum,
  requireString,
  validationError,
} from '../../utils/validate';
import { writeAuditLog } from '../audit/audit.service';
import { hashPassword } from '../auth/auth.service';
import * as invitationService from '../invitations/invitation.service';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_TIMEZONE,
  OrganizationModel,
  ORGANIZATION_STATUSES,
  PLAN_CODES,
  SUBSCRIPTION_STATUSES,
  type OrganizationStatus,
  type PlanCode,
  type SubscriptionStatus,
} from '../organizations/organization.model';
import { BusModel } from '../buses/bus.model';
import { StudentModel } from '../students/student.model';
import { UserModel } from '../users/user.model';
import {
  createOrganization,
  findOrganizationById,
  listOrganizations,
  setOrganizationStatus,
  toOrganizationJson,
  uniqueSlugFromName,
  updateOrganization,
  type ListOrganizationsFilter,
} from '../organizations/organization.repository';
import { createUser, findUserByEmail } from '../users/user.repository';
import * as subscriptionService from '../subscriptions/subscription.service';

function requireTimezone(value: unknown, field: string): string {
  const tz = requireString(value, field);
  if (!isValidTimeZone(tz)) {
    throw validationError(field, 'Must be a valid IANA timezone');
  }
  return tz;
}

function requireEmail(value: unknown, field: string): string {
  const email = requireString(value, field).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw validationError(field, 'Must be a valid email');
  }
  return email;
}

function requirePassword(value: unknown, field: string): string {
  const password = requireString(value, field);
  if (password.length < 8) {
    throw new AppError(422, 'PASSWORD_TOO_WEAK', 'Password must be at least 8 characters', [
      { field, message: 'Must be at least 8 characters' },
    ]);
  }
  return password;
}

function parseInitialAdmin(value: unknown) {
  if (value === undefined || value === null) {
    throw validationError('initialAdmin', 'Required');
  }
  if (typeof value !== 'object') {
    throw validationError('initialAdmin', 'Must be an object');
  }
  const admin = value as Record<string, unknown>;
  return {
    firstName: requireString(admin.firstName, 'initialAdmin.firstName'),
    lastName: requireString(admin.lastName, 'initialAdmin.lastName'),
    email: requireEmail(admin.email, 'initialAdmin.email'),
    password: requirePassword(admin.password, 'initialAdmin.password'),
  };
}

export function parseCreateOrganization(body: Record<string, unknown>) {
  const name = requireString(body.name, 'name');
  const country = requireString(body.country, 'country');
  const timezone =
    body.timezone !== undefined ? requireTimezone(body.timezone, 'timezone') : DEFAULT_TIMEZONE;
  const defaultLanguage =
    optionalString(body.defaultLanguage, 'defaultLanguage') ?? DEFAULT_LANGUAGE;
  const contactEmail = requireEmail(body.contactEmail, 'contactEmail');
  const contactPhone = optionalString(body.contactPhone, 'contactPhone');
  const planCode = requireEnum(body.planCode ?? body.plan, 'planCode', PLAN_CODES);
  const address = optionalString(body.address, 'address');
  const website = optionalString(body.website, 'website');
  const notes = optionalString(body.notes, 'notes');
  const logoUrl = optionalString(body.logoUrl, 'logoUrl');
  const status = optionalEnum(body.status, 'status', ORGANIZATION_STATUSES) ?? 'TRIAL';
  const initialAdmin = parseInitialAdmin(body.initialAdmin);

  return {
    name,
    country,
    timezone,
    defaultLanguage,
    contactEmail,
    contactPhone,
    planCode,
    address,
    website,
    notes,
    logoUrl,
    status,
    initialAdmin,
  };
}

export function parsePatchOrganization(body: Record<string, unknown>) {
  const name = asTrimmedString(body.name);
  const country = asTrimmedString(body.country);
  const timezone =
    body.timezone === undefined || body.timezone === null || body.timezone === ''
      ? undefined
      : requireTimezone(body.timezone, 'timezone');
  const defaultLanguage = asTrimmedString(body.defaultLanguage);
  const contactEmail =
    body.contactEmail === undefined || body.contactEmail === null || body.contactEmail === ''
      ? undefined
      : requireEmail(body.contactEmail, 'contactEmail');
  const contactPhone = optionalString(body.contactPhone, 'contactPhone');
  const address = optionalString(body.address, 'address');
  const website = optionalString(body.website, 'website');
  const notes = optionalString(body.notes, 'notes');
  const logoUrl = optionalString(body.logoUrl, 'logoUrl');

  if (
    !name &&
    !country &&
    !timezone &&
    !defaultLanguage &&
    !contactEmail &&
    contactPhone === undefined &&
    address === undefined &&
    website === undefined &&
    notes === undefined &&
    logoUrl === undefined
  ) {
    throw validationError('name', 'At least one field is required');
  }

  return {
    name,
    country,
    timezone,
    defaultLanguage,
    contactEmail,
    contactPhone,
    address,
    website,
    notes,
    logoUrl,
  };
}

export function parseSubscriptionBody(body: Record<string, unknown>) {
  const planCode = optionalEnum(body.planCode ?? body.plan, 'planCode', PLAN_CODES);
  const subscriptionStatus = optionalEnum(
    body.subscriptionStatus,
    'subscriptionStatus',
    SUBSCRIPTION_STATUSES,
  );
  if (
    !planCode &&
    !subscriptionStatus &&
    body.subscriptionStartedAt === undefined &&
    body.subscriptionEndsAt === undefined &&
    body.trialEndsAt === undefined
  ) {
    throw validationError('planCode', 'At least one subscription field is required');
  }
  return {
    planCode,
    subscriptionStatus,
    subscriptionStartedAt:
      body.subscriptionStartedAt === undefined
        ? undefined
        : body.subscriptionStartedAt === null
          ? null
          : new Date(String(body.subscriptionStartedAt)),
    subscriptionEndsAt:
      body.subscriptionEndsAt === undefined
        ? undefined
        : body.subscriptionEndsAt === null
          ? null
          : new Date(String(body.subscriptionEndsAt)),
    trialEndsAt:
      body.trialEndsAt === undefined
        ? undefined
        : body.trialEndsAt === null
          ? null
          : new Date(String(body.trialEndsAt)),
  };
}

export function parseAdminInvitation(body: Record<string, unknown>) {
  return {
    email: requireEmail(body.email, 'email'),
    firstName: requireString(body.firstName, 'firstName'),
    lastName: requireString(body.lastName, 'lastName'),
  };
}

export function parseAcceptInvitation(body: Record<string, unknown>) {
  return {
    password: requirePassword(body.password, 'password'),
    firstName: asTrimmedString(body.firstName),
    lastName: asTrimmedString(body.lastName),
  };
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 11000;
}

export async function createTenant(
  actor: AuthContext,
  body: Record<string, unknown>,
  req?: Request,
) {
  const parsed = parseCreateOrganization(body);

  const existingUser = await findUserByEmail(parsed.initialAdmin.email);
  if (existingUser) {
    throw new AppError(409, 'USER_ALREADY_EXISTS', 'Email is already registered');
  }

  const slug = await uniqueSlugFromName(parsed.name);
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const organization = await createOrganization({
    name: parsed.name,
    slug,
    status: parsed.status,
    country: parsed.country,
    timezone: parsed.timezone,
    defaultLanguage: parsed.defaultLanguage,
    contactEmail: parsed.contactEmail,
    contactPhone: parsed.contactPhone,
    planCode: parsed.planCode,
    subscriptionStatus: parsed.status === 'ACTIVE' ? 'ACTIVE' : 'TRIAL',
    subscriptionStartedAt: parsed.status === 'ACTIVE' ? now : null,
    trialEndsAt: parsed.status === 'TRIAL' || parsed.status === 'ACTIVE' ? trialEndsAt : null,
    address: parsed.address,
    website: parsed.website,
    notes: parsed.notes,
    logoUrl: parsed.logoUrl,
  });

  // note: standalone Mongo has no transactions; delete org if admin create fails. Upgrade: withTransaction on replica set.
  let adminUser;
  try {
    const passwordHash = await hashPassword(parsed.initialAdmin.password);
    adminUser = await createUser({
      organizationId: organization.id,
      email: parsed.initialAdmin.email,
      passwordHash,
      firstName: parsed.initialAdmin.firstName,
      lastName: parsed.initialAdmin.lastName,
      role: 'ADMIN',
      status: 'ACTIVE',
    });
  } catch (err) {
    await OrganizationModel.findByIdAndDelete(organization.id);
    if (isDuplicateKeyError(err)) {
      throw new AppError(409, 'USER_ALREADY_EXISTS', 'Email is already registered');
    }
    throw err;
  }

  await writeAuditLog({
    actor,
    action: 'TENANT_CREATED',
    resourceType: 'organization',
    resourceId: organization.id,
    organizationId: organization.id,
    metadata: { name: organization.name, slug: organization.slug, planCode: organization.planCode },
    req,
  });

  await writeAuditLog({
    actor,
    action: 'INITIAL_ADMIN_CREATED',
    resourceType: 'user',
    resourceId: adminUser.id,
    organizationId: organization.id,
    metadata: {
      email: adminUser.email,
      role: 'ADMIN',
      userId: adminUser.id,
    },
    req,
  });

  return {
    organization: toOrganizationJson(organization),
    initialAdmin: {
      userId: adminUser.id,
      email: adminUser.email,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
    },
  };
}

export function parseListTenantsQuery(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const filter: ListOrganizationsFilter = {
    status: optionalEnum(query.status, 'status', ORGANIZATION_STATUSES),
    q: asTrimmedString(query.q)?.toLowerCase(),
  };
  return { page, limit, skip, filter };
}

export async function listTenants(query: Record<string, unknown>) {
  const { page, limit, skip, filter } = parseListTenantsQuery(query);
  const { items, total } = await listOrganizations(skip, limit, filter);
  const data = await Promise.all(
    items.map(async (org) => {
      const usage = await subscriptionService.getUsage(org.id);
      return {
        ...toOrganizationJson(org),
        usage: {
          campusCount: usage.campusCount,
          studentCount: usage.studentCount,
          userCount: usage.userCount,
        },
      };
    }),
  );
  return {
    data,
    meta: { page, limit, total },
  };
}

export async function getDashboard() {
  const [orgCounts, students, teachers, buses] = await Promise.all([
    OrganizationModel.aggregate<{ _id: OrganizationStatus; count: number }>([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    StudentModel.countDocuments({}),
    UserModel.countDocuments({ role: 'TEACHER' }),
    BusModel.countDocuments({}),
  ]);

  const byStatus = Object.fromEntries(orgCounts.map((row) => [row._id, row.count])) as Partial<
    Record<OrganizationStatus, number>
  >;
  const total = orgCounts.reduce((sum, row) => sum + row.count, 0);

  return {
    organizations: {
      total,
      active: byStatus.ACTIVE ?? 0,
      trial: byStatus.TRIAL ?? 0,
      suspended: byStatus.SUSPENDED ?? 0,
      inactive: byStatus.INACTIVE ?? 0,
      cancelled: byStatus.CANCELLED ?? 0,
    },
    students,
    teachers,
    buses,
  };
}

export async function getTenant(organizationId: string) {
  const organization = await findOrganizationById(organizationId);
  if (!organization) {
    throw new AppError(404, 'NOT_FOUND', 'Not Found');
  }
  const usage = await subscriptionService.getUsage(organizationId);
  return {
    ...toOrganizationJson(organization),
    usage,
    plan: subscriptionService.getPlan(organization.planCode as PlanCode),
  };
}

export async function patchTenant(
  actor: AuthContext,
  organizationId: string,
  body: Record<string, unknown>,
  req?: Request,
) {
  const parsed = parsePatchOrganization(body);
  const organization = await updateOrganization(organizationId, parsed);
  if (!organization) {
    throw new AppError(404, 'NOT_FOUND', 'Not Found');
  }
  await writeAuditLog({
    actor,
    action: 'TENANT_UPDATED',
    resourceType: 'organization',
    resourceId: organizationId,
    organizationId,
    metadata: parsed,
    req,
  });
  return toOrganizationJson(organization);
}

const STATUS_TRANSITIONS: Partial<Record<OrganizationStatus, readonly OrganizationStatus[]>> = {
  TRIAL: ['ACTIVE', 'INACTIVE'],
  ACTIVE: ['SUSPENDED', 'INACTIVE'],
  SUSPENDED: ['ACTIVE'],
};

function assertStatusTransition(current: OrganizationStatus, next: OrganizationStatus): void {
  if (current === next) {
    return;
  }
  const allowed = STATUS_TRANSITIONS[current];
  if (!allowed?.includes(next)) {
    throw new AppError(
      422,
      'VALIDATION_ERROR',
      `Cannot transition organization from ${current} to ${next}`,
      [{ field: 'status', message: `Invalid transition from ${current} to ${next}` }],
    );
  }
}

async function transitionStatus(
  actor: AuthContext,
  organizationId: string,
  status: OrganizationStatus,
  action: 'TENANT_ACTIVATED' | 'TENANT_SUSPENDED' | 'TENANT_DEACTIVATED' | 'TENANT_CANCELLED',
  req?: Request,
) {
  const existing = await findOrganizationById(organizationId);
  if (!existing) {
    throw new AppError(404, 'NOT_FOUND', 'Not Found');
  }
  assertStatusTransition(existing.status, status);
  if (existing.status === status) {
    return toOrganizationJson(existing);
  }

  const organization = await setOrganizationStatus(organizationId, status);
  if (!organization) {
    throw new AppError(404, 'NOT_FOUND', 'Not Found');
  }
  await writeAuditLog({
    actor,
    action,
    resourceType: 'organization',
    resourceId: organizationId,
    organizationId,
    metadata: { status, previousStatus: existing.status },
    req,
  });
  return toOrganizationJson(organization);
}

export async function activateTenant(actor: AuthContext, organizationId: string, req?: Request) {
  return transitionStatus(actor, organizationId, 'ACTIVE', 'TENANT_ACTIVATED', req);
}

export async function suspendTenant(actor: AuthContext, organizationId: string, req?: Request) {
  return transitionStatus(actor, organizationId, 'SUSPENDED', 'TENANT_SUSPENDED', req);
}

export async function deactivateTenant(actor: AuthContext, organizationId: string, req?: Request) {
  return transitionStatus(actor, organizationId, 'INACTIVE', 'TENANT_DEACTIVATED', req);
}

export async function getSubscription(organizationId: string) {
  const organization = await findOrganizationById(organizationId);
  if (!organization) {
    throw new AppError(404, 'NOT_FOUND', 'Not Found');
  }
  return {
    organizationId,
    planCode: organization.planCode,
    subscriptionStatus: organization.subscriptionStatus,
    subscriptionStartedAt: organization.subscriptionStartedAt ?? null,
    subscriptionEndsAt: organization.subscriptionEndsAt ?? null,
    trialEndsAt: organization.trialEndsAt ?? null,
    plan: subscriptionService.getPlan(organization.planCode as PlanCode),
  };
}

export async function setSubscription(
  actor: AuthContext,
  organizationId: string,
  body: Record<string, unknown>,
  req?: Request,
) {
  const parsed = parseSubscriptionBody(body);
  const organization = await subscriptionService.updateSubscription(organizationId, {
    planCode: parsed.planCode as PlanCode | undefined,
    subscriptionStatus: parsed.subscriptionStatus as SubscriptionStatus | undefined,
    subscriptionStartedAt: parsed.subscriptionStartedAt,
    subscriptionEndsAt: parsed.subscriptionEndsAt,
    trialEndsAt: parsed.trialEndsAt,
  });
  await writeAuditLog({
    actor,
    action: 'SUBSCRIPTION_CHANGED',
    resourceType: 'organization',
    resourceId: organizationId,
    organizationId,
    metadata: {
      planCode: organization.planCode,
      subscriptionStatus: organization.subscriptionStatus,
    },
    req,
  });
  return getSubscription(organizationId);
}

export async function inviteAdmin(
  actor: AuthContext,
  organizationId: string,
  body: Record<string, unknown>,
  req?: Request,
) {
  const parsed = parseAdminInvitation(body);
  const result = await invitationService.createAdminInvitation({
    actor,
    organizationId,
    email: parsed.email,
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    req,
  });
  return {
    invitationId: result.invitationId,
    email: result.email,
    expiresAt: result.expiresAt,
    token: result.token,
  };
}

export async function acceptAdminInvitation(token: string, body: Record<string, unknown>) {
  const parsed = parseAcceptInvitation(body);
  return invitationService.acceptInvitation({
    rawToken: token,
    password: parsed.password,
    firstName: parsed.firstName,
    lastName: parsed.lastName,
  });
}

export async function getUsage(organizationId: string) {
  const organization = await findOrganizationById(organizationId);
  if (!organization) {
    throw new AppError(404, 'NOT_FOUND', 'Not Found');
  }
  const usage = await subscriptionService.getUsage(organizationId);
  const plan = subscriptionService.getPlan(organization.planCode as PlanCode);
  return {
    organizationId,
    planCode: organization.planCode,
    usage,
    limits: {
      maxCampuses: plan.maxCampuses,
      maxStudents: plan.maxStudents,
      maxUsers: plan.maxUsers,
      maxBuses: plan.maxBuses,
    },
    features: plan.features,
  };
}
