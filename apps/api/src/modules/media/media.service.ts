import { randomBytes } from 'node:crypto';
import type { AuthContext } from '../../types';
import { env } from '../../config/env';
import { AppError } from '../../utils/appError';
import { logger } from '../../utils/logger';
import { notFound, validationError } from '../../utils/validate';
import { utcRangeForCalendarDate } from '../../utils/timezone';
import { assertStudentReadable } from '../students/student.service';
import { findStudentById } from '../students/student.repository';
import type { Student } from '../students/student.model';
import { processPhoto, sniffImageType } from './media.image';
import { createMedia, findMediaById, listStudentMedia, softDeleteMedia } from './media.repository';
import type { Media, MediaType } from './media.model';
import {
  getObjectStorage,
  isValidStorageSignature,
  LocalObjectStorage,
} from './storage/object-storage.service';
import { notifyMediaAvailable } from '../notifications/notification.service';

function storageSecret(): string {
  return env.storageSecret || env.jwtAccessSecret;
}

function signedUrlTtl(): number {
  const ttl = env.mediaSignedUrlTtlSeconds;
  if (!Number.isFinite(ttl) || ttl < 1) {
    return 600;
  }
  return ttl;
}

export function toUploadJson(media: Media & { id: string }) {
  return {
    media: {
      id: media.id,
      mediaType: media.mediaType,
      contentType: media.contentType,
      width: media.width,
      height: media.height,
      capturedAt: media.capturedAt.toISOString(),
      createdAt: media.createdAt.toISOString(),
    },
  };
}

async function toAccessJson(media: Media & { id: string }) {
  const storage = getObjectStorage();
  const ttl = signedUrlTtl();
  const [url, thumbnailUrl] = await Promise.all([
    storage.getSignedUrl(media.storageKey, ttl),
    storage.getSignedUrl(media.thumbnailStorageKey, ttl),
  ]);
  return {
    id: media.id,
    mediaType: media.mediaType,
    contentType: media.contentType,
    width: media.width,
    height: media.height,
    capturedAt: media.capturedAt.toISOString(),
    createdAt: media.createdAt.toISOString(),
    thumbnailUrl,
    url,
  };
}

async function loadStudent(auth: AuthContext, studentId: string, requireActive: boolean) {
  const student = await findStudentById(auth.organizationId, studentId);
  if (!student) {
    throw notFound();
  }
  await assertStudentReadable(auth, student);
  if (requireActive && student.status !== 'ACTIVE') {
    throw new AppError(400, 'BAD_REQUEST', 'Student is not active');
  }
  return student as Student & { id: string };
}

async function loadAuthorizedMedia(auth: AuthContext, mediaId: string) {
  const media = await findMediaById(auth.organizationId, mediaId);
  if (!media) {
    throw notFound();
  }
  await loadStudent(auth, String(media.studentId), false);
  return media as Media & { id: string };
}

export async function uploadStudentPhoto(
  auth: AuthContext,
  studentId: string,
  input: { mediaType: MediaType; capturedAt: Date; file?: Express.Multer.File },
) {
  if (auth.role === 'GUARDIAN' || auth.role === 'DRIVER') {
    throw new AppError(403, 'FORBIDDEN', 'You do not have permission to perform this action');
  }
  const student = await loadStudent(auth, studentId, true);
  const file = input.file;
  if (!file?.buffer?.length) {
    throw validationError('file', 'Required');
  }
  if (file.buffer.length > env.mediaMaxUploadBytes) {
    throw validationError('file', 'Exceeds the maximum size');
  }
  if (!sniffImageType(file.buffer)) {
    throw validationError('file', 'Must be a JPEG, PNG, or WEBP image');
  }

  const processed = await processPhoto(file.buffer);
  const photoId = randomBytes(16).toString('hex');
  const prefix = `organizations/${auth.organizationId}/students/${student.id}/photos/${photoId}`;
  const storageKey = `${prefix}/original.jpg`;
  const thumbnailStorageKey = `${prefix}/thumbnail.jpg`;
  const storage = getObjectStorage();

  await storage.upload(storageKey, processed.original, processed.contentType);
  try {
    await storage.upload(thumbnailStorageKey, processed.thumbnail, processed.contentType);
  } catch (err) {
    await storage.delete(storageKey);
    throw err;
  }

  try {
    const media = await createMedia(auth.organizationId, {
      studentId: student.id,
      uploadedBy: auth.userId,
      mediaType: input.mediaType,
      storageKey,
      thumbnailStorageKey,
      contentType: processed.contentType,
      size: processed.original.length,
      width: processed.width,
      height: processed.height,
      capturedAt: input.capturedAt,
    });
    logger.info('media uploaded', {
      organizationId: auth.organizationId,
      userId: auth.userId,
      studentId: student.id,
      mediaId: media.id,
    });
    try {
      await notifyMediaAvailable({
        organizationId: auth.organizationId,
        studentId: student.id,
        mediaId: media.id,
      });
    } catch (notifyErr) {
      logger.error('Failed to enqueue media notification', notifyErr);
    }
    return toUploadJson(media);
  } catch (err) {
    await Promise.all([storage.delete(storageKey), storage.delete(thumbnailStorageKey)]);
    throw err;
  }
}

export async function listStudentPhotos(
  auth: AuthContext,
  studentId: string,
  opts: { date?: string; mediaType?: MediaType; page: number; limit: number; skip: number },
  timeZone: string,
) {
  const student = await loadStudent(auth, studentId, false);
  const extra: Record<string, unknown> = {};
  if (opts.mediaType) {
    extra.mediaType = opts.mediaType;
  }
  if (opts.date) {
    const { start, endExclusive } = utcRangeForCalendarDate(opts.date, timeZone);
    extra.capturedAt = { $gte: start, $lt: endExclusive };
  }
  const result = await listStudentMedia(
    auth.organizationId,
    student.id,
    extra,
    opts.skip,
    opts.limit,
  );
  return {
    items: await Promise.all(
      result.items.map((item) => toAccessJson(item as Media & { id: string })),
    ),
    meta: { page: opts.page, limit: opts.limit, total: result.total },
  };
}

export async function getMedia(auth: AuthContext, mediaId: string) {
  const media = await loadAuthorizedMedia(auth, mediaId);
  return toAccessJson(media);
}

export async function deleteMedia(auth: AuthContext, mediaId: string) {
  const media = await loadAuthorizedMedia(auth, mediaId);
  const storage = getObjectStorage();
  await storage.delete(media.storageKey);
  await storage.delete(media.thumbnailStorageKey);
  const deleted = await softDeleteMedia(auth.organizationId, media.id);
  if (!deleted) {
    throw notFound();
  }
  logger.info('media deleted', {
    organizationId: auth.organizationId,
    userId: auth.userId,
    studentId: String(media.studentId),
    mediaId: media.id,
  });
}

export async function readSignedFile(query: {
  key: string;
  expiresAtUnix: number;
  signature: string;
}) {
  if (!isValidStorageSignature(query.key, query.expiresAtUnix, query.signature, storageSecret())) {
    throw notFound();
  }
  const storage = getObjectStorage();
  if (!(storage instanceof LocalObjectStorage)) {
    throw notFound();
  }
  const body = await storage.read(query.key);
  if (!body) {
    throw notFound();
  }
  return { body, contentType: 'image/jpeg' };
}
