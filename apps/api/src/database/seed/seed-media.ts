import sharp from 'sharp';
import { MediaModel } from '../../modules/media/media.model';
import { processPhoto } from '../../modules/media/media.image';
import { getObjectStorage } from '../../modules/media/storage/object-storage.service';
import { MEDIA_MULTIPLE, MEDIA_SINGLE_EXTRA } from './catalog';
import { atLocal } from './seed-helpers';
import type { SeedIds } from './seed-types';

export async function seedMedia(ids: SeedIds): Promise<void> {
  await MediaModel.deleteMany({ organizationId: ids.organizationId });
  const storage = getObjectStorage();
  const source = await sharp({
    create: { width: 320, height: 240, channels: 3, background: { r: 196, g: 214, b: 176 } },
  })
    .jpeg({ quality: 70 })
    .toBuffer();
  const processed = await processPhoto(source);
  const teacher = ids.teachers.kg_a;

  const withPhotos = [
    ...MEDIA_MULTIPLE.map((key) => ({ key, count: key.includes('آدم') ? 3 : 2 })),
    ...MEDIA_SINGLE_EXTRA.map((key) => ({ key, count: 1 })),
  ];

  for (const item of withPhotos) {
    const student = ids.studentsByKey.get(item.key);
    if (!student) throw new Error(`Missing media student ${item.key}`);
    for (let i = 0; i < item.count; i += 1) {
      const photoId = `seed-${student.studentNumber.toLowerCase()}-${i + 1}`;
      const prefix = `organizations/${String(ids.organizationId)}/students/${String(student.id)}/photos/${photoId}`;
      const storageKey = `${prefix}/original.jpg`;
      const thumbnailStorageKey = `${prefix}/thumbnail.jpg`;
      await storage.upload(storageKey, processed.original, processed.contentType);
      await storage.upload(thumbnailStorageKey, processed.thumbnail, processed.contentType);
      await MediaModel.create({
        organizationId: ids.organizationId,
        studentId: student.id,
        uploadedBy: teacher,
        mediaType: 'PHOTO',
        storageKey,
        thumbnailStorageKey,
        contentType: processed.contentType,
        size: processed.original.length,
        width: processed.width,
        height: processed.height,
        capturedAt: atLocal(ids.today, 9, 10 + i, ids.timezone),
      });
    }
  }
}
