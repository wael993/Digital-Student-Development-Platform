import mongoose from 'mongoose';
import { connectMongo, disconnectMongo } from '../config/mongodb';
import { hashPassword } from '../modules/auth/auth.service';
import { OrganizationModel } from '../modules/organizations/organization.model';
import { UserModel } from '../modules/users/user.model';
import { logger } from '../utils/logger';
import type { UserRole } from '../types';

const SEED_PASSWORD = 'Password123!';

const ORGS = [
  { key: 'a', name: 'Nursery A' },
  { key: 'b', name: 'Nursery B' },
] as const;

const USERS: {
  email: string;
  org: 'a' | 'b';
  role: UserRole;
  firstName: string;
  lastName: string;
}[] = [
  { email: 'admin.a@example.com', org: 'a', role: 'ADMIN', firstName: 'Ada', lastName: 'Admin' },
  {
    email: 'teacher@example.com',
    org: 'a',
    role: 'TEACHER',
    firstName: 'John',
    lastName: 'Smith',
  },
  {
    email: 'guardian.a@example.com',
    org: 'a',
    role: 'GUARDIAN',
    firstName: 'Gina',
    lastName: 'Guardian',
  },
  { email: 'admin.b@example.com', org: 'b', role: 'ADMIN', firstName: 'Bea', lastName: 'Admin' },
  {
    email: 'teacher.b@example.com',
    org: 'b',
    role: 'TEACHER',
    firstName: 'Tom',
    lastName: 'Teacher',
  },
  {
    email: 'guardian.b@example.com',
    org: 'b',
    role: 'GUARDIAN',
    firstName: 'Gabe',
    lastName: 'Guardian',
  },
];

async function seed(): Promise<void> {
  await connectMongo();
  const passwordHash = await hashPassword(SEED_PASSWORD);
  const orgIds: Record<'a' | 'b', mongoose.Types.ObjectId> = {
    a: new mongoose.Types.ObjectId(),
    b: new mongoose.Types.ObjectId(),
  };

  for (const org of ORGS) {
    const doc = await OrganizationModel.findOneAndUpdate(
      { name: org.name },
      { name: org.name, status: 'ACTIVE' },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    orgIds[org.key] = doc._id as mongoose.Types.ObjectId;
  }

  for (const user of USERS) {
    await UserModel.findOneAndUpdate(
      { email: user.email },
      {
        organizationId: orgIds[user.org],
        email: user.email,
        passwordHash,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: 'ACTIVE',
      },
      { upsert: true },
    );
  }

  logger.info(`Seeded ${ORGS.length} organizations and ${USERS.length} users`);
  await disconnectMongo();
}

seed().catch((error: unknown) => {
  logger.error('Seed failed', error);
  process.exit(1);
});
