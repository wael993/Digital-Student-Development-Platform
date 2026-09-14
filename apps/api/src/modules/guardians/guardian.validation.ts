import { GUARDIAN_RELATIONSHIPS, type GuardianRelationshipType } from './guardian.model';
import {
  asTrimmedString,
  optionalBoolean,
  optionalObjectId,
  parsePagination,
  requireEnum,
  requireString,
  validationError,
} from '../../utils/validate';

export function parseCreateGuardian(body: {
  email?: unknown;
  password?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  status?: unknown;
}) {
  return {
    email: requireString(body.email, 'email').toLowerCase(),
    password: requireString(body.password, 'password'),
    firstName: requireString(body.firstName, 'firstName'),
    lastName: requireString(body.lastName, 'lastName'),
  };
}

export function parsePatchGuardian(body: {
  firstName?: unknown;
  lastName?: unknown;
  status?: unknown;
}) {
  const firstName = asTrimmedString(body.firstName);
  const lastName = asTrimmedString(body.lastName);
  if (!firstName && !lastName && body.status === undefined) {
    throw validationError('firstName', 'Required');
  }
  return { firstName, lastName };
}

export function parseAssociateGuardian(body: {
  userId?: unknown;
  email?: unknown;
  password?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  relationship?: unknown;
  isPrimary?: unknown;
  canPickup?: unknown;
  receivesNotifications?: unknown;
}) {
  const userId = optionalObjectId(body.userId, 'userId');
  const email = asTrimmedString(body.email)?.toLowerCase();
  if (!userId && !email) {
    throw validationError('userId', 'userId or email is required');
  }
  return {
    userId,
    email,
    password: asTrimmedString(body.password),
    firstName: asTrimmedString(body.firstName),
    lastName: asTrimmedString(body.lastName),
    relationship: requireEnum(body.relationship, 'relationship', GUARDIAN_RELATIONSHIPS),
    isPrimary: optionalBoolean(body.isPrimary, 'isPrimary'),
    canPickup: optionalBoolean(body.canPickup, 'canPickup'),
    receivesNotifications: optionalBoolean(body.receivesNotifications, 'receivesNotifications'),
  };
}

export function parseGuardianListQuery(query: { page?: unknown; limit?: unknown }) {
  return parsePagination(query);
}

export type AssociateInput = {
  userId?: string;
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  relationship: GuardianRelationshipType;
  isPrimary?: boolean;
  canPickup?: boolean;
  receivesNotifications?: boolean;
};
