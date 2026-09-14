import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import { env } from './env';

export async function connectMongo(): Promise<void> {
  await mongoose.connect(env.mongodbUri);
  logger.info('Connected to MongoDB');
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}
