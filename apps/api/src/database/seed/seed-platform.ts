import { hashPassword } from '../../modules/auth/auth.service';
import { UserModel } from '../../modules/users/user.model';
import { SEED_PASSWORD, SEED_PLATFORM_ADMIN_EMAIL } from './catalog';
import { upsert } from './seed-helpers';

export { SEED_PLATFORM_ADMIN_EMAIL };

export async function seedPlatformAdmin(): Promise<void> {
  const passwordHash = await hashPassword(SEED_PASSWORD);
  await upsert(
    UserModel,
    { email: SEED_PLATFORM_ADMIN_EMAIL },
    {
      organizationId: null,
      email: SEED_PLATFORM_ADMIN_EMAIL,
      passwordHash,
      firstName: 'Platform',
      lastName: 'Operator',
      role: 'PLATFORM_ADMIN',
      status: 'ACTIVE',
      campusIds: [],
      classroomIds: [],
      routeIds: [],
    },
  );
}
