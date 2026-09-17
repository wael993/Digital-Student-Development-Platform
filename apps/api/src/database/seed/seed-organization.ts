import { OrganizationModel } from '../../modules/organizations/organization.model';
import { SEED_ORG_NAME, SEED_TIMEZONE } from './catalog';
import { upsert } from './seed-helpers';
import type { SeedIds } from './seed-types';

export async function seedOrganization(ids: SeedIds): Promise<void> {
  const org = await upsert(
    OrganizationModel,
    { name: SEED_ORG_NAME },
    { name: SEED_ORG_NAME, status: 'ACTIVE', timezone: SEED_TIMEZONE },
  );
  ids.organizationId = org._id;
  ids.timezone = org.timezone || SEED_TIMEZONE;
}
