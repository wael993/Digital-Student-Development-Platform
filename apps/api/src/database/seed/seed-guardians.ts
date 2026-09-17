import { hashPassword } from '../../modules/auth/auth.service';
import { StudentGuardianModel } from '../../modules/guardians/guardian.model';
import { UserModel } from '../../modules/users/user.model';
import { catalogEmails, FAMILIES, SEED_PASSWORD } from './catalog';
import { childKey, upsert } from './seed-helpers';
import type { SeedIds } from './seed-types';

export async function seedGuardians(ids: SeedIds): Promise<void> {
  const passwordHash = await hashPassword(SEED_PASSWORD);

  for (const family of FAMILIES) {
    const people = [...family.guardians, ...(family.pickup ?? [])];
    for (const person of people) {
      const doc = await upsert(
        UserModel,
        { email: person.email },
        {
          organizationId: ids.organizationId,
          email: person.email,
          passwordHash,
          firstName: person.firstName,
          lastName: person.lastName,
          role: 'GUARDIAN',
          status: 'ACTIVE',
          campusIds: [],
          classroomIds: [],
          routeIds: [],
        },
      );
      ids.usersByEmail.set(person.email, doc._id);
    }

    for (const child of family.children) {
      const student = ids.studentsByKey.get(childKey(family.key, child.firstName));
      if (!student) {
        throw new Error(`Missing student ${family.key}/${child.firstName}`);
      }
      for (const person of people) {
        const userId = ids.usersByEmail.get(person.email);
        if (!userId) {
          throw new Error(`Missing guardian user ${person.email}`);
        }
        await upsert(
          StudentGuardianModel,
          { organizationId: ids.organizationId, studentId: student.id, userId },
          {
            organizationId: ids.organizationId,
            studentId: student.id,
            userId,
            relationship: person.relationship,
            isPrimary: person.isPrimary,
            canPickup: person.canPickup,
            receivesNotifications: person.receivesNotifications,
          },
        );
      }
    }
  }

  const keepEmails = catalogEmails();
  const keepUserIds = keepEmails
    .map((email) => ids.usersByEmail.get(email))
    .filter((id): id is NonNullable<typeof id> => Boolean(id));
  await UserModel.deleteMany({
    organizationId: ids.organizationId,
    role: 'GUARDIAN',
    email: { $nin: keepEmails },
  });
  await StudentGuardianModel.deleteMany({
    organizationId: ids.organizationId,
    userId: { $nin: keepUserIds },
  });
}
