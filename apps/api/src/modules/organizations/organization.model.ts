import mongoose, { Schema } from 'mongoose';

export const ORGANIZATION_STATUSES = [
  'TRIAL',
  'ACTIVE',
  'SUSPENDED',
  'INACTIVE',
  'CANCELLED',
] as const;
export type OrganizationStatus = (typeof ORGANIZATION_STATUSES)[number];

/** Statuses that allow normal tenant application access. */
export const OPERATIONAL_ORGANIZATION_STATUSES = ['TRIAL', 'ACTIVE'] as const;

export function isOrganizationOperational(status: OrganizationStatus): boolean {
  return (OPERATIONAL_ORGANIZATION_STATUSES as readonly string[]).includes(status);
}

export const PLAN_CODES = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'] as const;
export type PlanCode = (typeof PLAN_CODES)[number];

export const SUBSCRIPTION_STATUSES = ['NONE', 'TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const DEFAULT_TIMEZONE = 'UTC';
export const DEFAULT_LANGUAGE = 'ar';

export interface Organization {
  name: string;
  slug: string;
  status: OrganizationStatus;
  country: string;
  timezone: string;
  defaultLanguage: string;
  contactEmail: string;
  contactPhone?: string;
  planCode: PlanCode;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartedAt?: Date | null;
  subscriptionEndsAt?: Date | null;
  trialEndsAt?: Date | null;
  address?: string;
  website?: string;
  notes?: string;
  logoUrl?: string;
  /** Set when cancelled; permanent deletion is an explicit later operation. */
  retentionEndsAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const organizationSchema = new Schema<Organization>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, required: true, enum: ORGANIZATION_STATUSES, default: 'TRIAL' },
    country: { type: String, required: true, trim: true, default: 'SA' },
    timezone: { type: String, required: true, default: DEFAULT_TIMEZONE, trim: true },
    defaultLanguage: { type: String, required: true, default: DEFAULT_LANGUAGE, trim: true },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    contactPhone: { type: String, trim: true },
    planCode: { type: String, required: true, enum: PLAN_CODES, default: 'STARTER' },
    subscriptionStatus: {
      type: String,
      required: true,
      enum: SUBSCRIPTION_STATUSES,
      default: 'TRIAL',
    },
    subscriptionStartedAt: { type: Date, default: null },
    subscriptionEndsAt: { type: Date, default: null },
    trialEndsAt: { type: Date, default: null },
    address: { type: String, trim: true },
    website: { type: String, trim: true },
    notes: { type: String, trim: true },
    logoUrl: { type: String, trim: true },
    retentionEndsAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'organizations' },
);

organizationSchema.index({ status: 1 });
organizationSchema.index({ planCode: 1 });

export const OrganizationModel =
  mongoose.models.Organization ?? mongoose.model<Organization>('Organization', organizationSchema);
