import { CampusModel } from '../../modules/campuses/campus.model';
import { CAMPUSES } from './catalog';
import { upsert } from './seed-helpers';
import type { SeedIds } from './seed-types';

export async function seedCampuses(ids: SeedIds): Promise<void> {
  for (const campus of CAMPUSES) {
    const doc = await upsert(
      CampusModel,
      { organizationId: ids.organizationId, name: campus.name },
      { organizationId: ids.organizationId, name: campus.name, status: 'ACTIVE' },
    );
    ids.campuses[campus.key] = doc._id;
  }
}
