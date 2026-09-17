import {
  OrganizationModel,
  type Organization,
  type OrganizationStatus,
  type PlanCode,
  type SubscriptionStatus,
} from './organization.model';

export type CreateOrganizationInput = {
  name: string;
  slug: string;
  status?: OrganizationStatus;
  country: string;
  timezone: string;
  defaultLanguage: string;
  contactEmail: string;
  contactPhone?: string;
  planCode: PlanCode;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionStartedAt?: Date | null;
  subscriptionEndsAt?: Date | null;
  trialEndsAt?: Date | null;
  address?: string;
  website?: string;
  notes?: string;
  logoUrl?: string;
};

export type UpdateOrganizationInput = Partial<
  Omit<CreateOrganizationInput, 'slug'> & {
    retentionEndsAt?: Date | null;
  }
>;

export async function findOrganizationById(id: string) {
  return OrganizationModel.findById(id);
}

export async function findOrganizationBySlug(slug: string) {
  return OrganizationModel.findOne({ slug: slug.toLowerCase().trim() });
}

export async function listOrganizations(skip = 0, limit = 20) {
  const [items, total] = await Promise.all([
    OrganizationModel.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
    OrganizationModel.countDocuments({}),
  ]);
  return { items, total };
}

export async function createOrganization(input: CreateOrganizationInput | { name: string; status?: OrganizationStatus }) {
  // Backward-compatible path used by tests/seed helpers.
  if (!('slug' in input) || !input.slug) {
    const name = input.name;
    const slug = await uniqueSlugFromName(name);
    return OrganizationModel.create({
      name,
      slug,
      status: input.status ?? 'ACTIVE',
      country: 'SA',
      timezone: 'UTC',
      defaultLanguage: 'ar',
      contactEmail: `contact+${slug}@example.local`,
      planCode: 'STARTER',
      subscriptionStatus: input.status === 'ACTIVE' ? 'ACTIVE' : 'TRIAL',
    });
  }
  return OrganizationModel.create(input);
}

export async function updateOrganization(id: string, patch: UpdateOrganizationInput) {
  return OrganizationModel.findByIdAndUpdate(id, patch, { new: true });
}

export async function setOrganizationStatus(id: string, status: OrganizationStatus) {
  const patch: UpdateOrganizationInput = { status };
  if (status === 'CANCELLED') {
    // note: default 90-day retention; permanent deletion is an explicit audited operation later.
    patch.retentionEndsAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  }
  return updateOrganization(id, patch);
}

function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'org';
}

export async function uniqueSlugFromName(name: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let n = 0;
  while (await findOrganizationBySlug(candidate)) {
    n += 1;
    candidate = `${base}-${n}`;
  }
  return candidate;
}

export function toOrganizationJson(organization: Organization & { id: string }) {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    status: organization.status,
    country: organization.country,
    timezone: organization.timezone,
    defaultLanguage: organization.defaultLanguage,
    contactEmail: organization.contactEmail,
    contactPhone: organization.contactPhone ?? null,
    planCode: organization.planCode,
    subscriptionStatus: organization.subscriptionStatus,
    subscriptionStartedAt: organization.subscriptionStartedAt ?? null,
    subscriptionEndsAt: organization.subscriptionEndsAt ?? null,
    trialEndsAt: organization.trialEndsAt ?? null,
    address: organization.address ?? null,
    website: organization.website ?? null,
    notes: organization.notes ?? null,
    logoUrl: organization.logoUrl ?? null,
    retentionEndsAt: organization.retentionEndsAt ?? null,
    createdAt: organization.createdAt,
    updatedAt: organization.updatedAt,
  };
}
