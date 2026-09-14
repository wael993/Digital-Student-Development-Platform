import mongoose from 'mongoose';
import { connectMongo, disconnectMongo } from '../config/mongodb';
import { logger } from '../utils/logger';
import { hashPassword } from '../modules/auth/auth.service';
import { UserModel } from '../modules/users/user.model';

const SEED_EMAIL = 'teacher@example.com';
const SEED_PASSWORD = 'Password123!';
const SEED_ORG = new mongoose.Types.ObjectId('000000000000000000000001');

async function seed(): Promise<void> {
  await connectMongo();
  const passwordHash = await hashPassword(SEED_PASSWORD);
  await UserModel.findOneAndUpdate(
    { email: SEED_EMAIL },
    {
      organizationId: SEED_ORG,
      email: SEED_EMAIL,
      passwordHash,
      firstName: 'John',
      lastName: 'Smith',
      role: 'TEACHER',
      status: 'ACTIVE',
    },
    { upsert: true },
  );
  logger.info(`Seeded login ${SEED_EMAIL}`);
  await disconnectMongo();
}

seed().catch((error: unknown) => {
  logger.error('Seed failed', error);
  process.exit(1);
});
