import mongoose from 'mongoose';
import { notFound } from '../../utils/validate';

export function parseStudentId(value: unknown): string {
  if (typeof value !== 'string' || !mongoose.isValidObjectId(value)) {
    throw notFound();
  }
  return value;
}
