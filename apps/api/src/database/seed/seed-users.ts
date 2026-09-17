import { hashPassword } from '../../modules/auth/auth.service';
import { ClassroomModel } from '../../modules/classrooms/classroom.model';
import { UserModel } from '../../modules/users/user.model';
import { catalogEmails, SEED_PASSWORD, STAFF } from './catalog';
import { upsert } from './seed-helpers';
import type { SeedIds } from './seed-types';

export async function seedUsers(ids: SeedIds): Promise<void> {
  const passwordHash = await hashPassword(SEED_PASSWORD);

  for (const admin of STAFF.admins) {
    const doc = await upsert(
      UserModel,
      { email: admin.email },
      {
        organizationId: ids.organizationId,
        email: admin.email,
        passwordHash,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: 'ADMIN',
        status: 'ACTIVE',
        campusIds: [],
        classroomIds: [],
        routeIds: [],
      },
    );
    ids.admins.push(doc._id);
    ids.usersByEmail.set(admin.email, doc._id);
  }

  for (const supervisor of STAFF.supervisors) {
    const campusIds = [ids.campuses[supervisor.campusKey]];
    const doc = await upsert(
      UserModel,
      { email: supervisor.email },
      {
        organizationId: ids.organizationId,
        email: supervisor.email,
        passwordHash,
        firstName: supervisor.firstName,
        lastName: supervisor.lastName,
        role: 'SUPERVISOR',
        status: 'ACTIVE',
        campusIds,
        classroomIds: [],
        routeIds: [],
      },
    );
    ids.supervisors[supervisor.campusKey] = doc._id;
    ids.usersByEmail.set(supervisor.email, doc._id);
  }

  for (const teacher of STAFF.teachers) {
    const classroomIds = [ids.classrooms[teacher.classKey]];
    const doc = await upsert(
      UserModel,
      { email: teacher.email },
      {
        organizationId: ids.organizationId,
        email: teacher.email,
        passwordHash,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        role: 'TEACHER',
        status: 'ACTIVE',
        campusIds: [],
        classroomIds,
        routeIds: [],
      },
    );
    ids.teachers[teacher.classKey] = doc._id;
    ids.usersByEmail.set(teacher.email, doc._id);
    await ClassroomModel.updateOne(
      { _id: ids.classrooms[teacher.classKey] },
      { teacherIds: [doc._id] },
    );
  }

  for (const driver of STAFF.drivers) {
    const doc = await upsert(
      UserModel,
      { email: driver.email },
      {
        organizationId: ids.organizationId,
        email: driver.email,
        passwordHash,
        firstName: driver.firstName,
        lastName: driver.lastName,
        role: 'DRIVER',
        status: 'ACTIVE',
        campusIds: [],
        classroomIds: [],
        routeIds: [],
      },
    );
    ids.drivers.push(doc._id);
    ids.usersByEmail.set(driver.email, doc._id);
  }

  const keep = catalogEmails();
  await UserModel.deleteMany({
    organizationId: ids.organizationId,
    role: { $in: ['ADMIN', 'SUPERVISOR', 'TEACHER', 'DRIVER'] },
    email: { $nin: keep },
  });
}
