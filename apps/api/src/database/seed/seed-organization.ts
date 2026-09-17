import { OrganizationModel } from '../../modules/organizations/organization.model';
import { SEED_ORG_NAME, SEED_TIMEZONE } from './catalog';
import { upsert } from './seed-helpers';
import type { SeedIds } from './seed-types';

export async function seedOrganization(ids: SeedIds): Promise<void> {
  const org = await upsert(
    OrganizationModel,
    { name: SEED_ORG_NAME },
    {
      name: SEED_ORG_NAME,
      slug: 'baraem-almustaqbal',
      status: 'ACTIVE',
      country: 'SA',
      timezone: SEED_TIMEZONE,
      defaultLanguage: 'ar',
      contactEmail: 'contact@baraem-demo.local',
      contactPhone: '+966500000000',
      planCode: 'PROFESSIONAL',
      subscriptionStatus: 'ACTIVE',
      subscriptionStartedAt: new Date(),
      trialEndsAt: null,
    },
  );
  ids.organizationId = org._id;
  ids.timezone = org.timezone || SEED_TIMEZONE;
}
