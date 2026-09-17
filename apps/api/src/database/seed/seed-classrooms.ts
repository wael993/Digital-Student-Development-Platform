import { ClassroomModel } from '../../modules/classrooms/classroom.model';
import { CLASSROOMS } from './catalog';
import { upsert } from './seed-helpers';
import type { SeedIds } from './seed-types';

export async function seedClassrooms(ids: SeedIds): Promise<void> {
  for (const classroom of CLASSROOMS) {
    const campusId = ids.campuses[classroom.campusKey];
    const doc = await upsert(
      ClassroomModel,
      { organizationId: ids.organizationId, name: classroom.name },
      {
        organizationId: ids.organizationId,
        campusId,
        name: classroom.name,
        level: classroom.level,
        status: 'ACTIVE',
      },
    );
    ids.classrooms[classroom.key] = doc._id;
  }
}
