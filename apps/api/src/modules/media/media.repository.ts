import { tenantFilter, withTenant } from '../../data/tenant';
import { MediaModel, type MediaType } from './media.model';

export async function createMedia(
  organizationId: string,
  input: {
    studentId: string;
    uploadedBy: string;
    mediaType: MediaType;
    storageKey: string;
    thumbnailStorageKey: string;
    contentType: string;
    size: number;
    width: number;
    height: number;
    capturedAt: Date;
  },
) {
  return MediaModel.create(withTenant(input, organizationId));
}

export async function findMediaById(organizationId: string, id: string) {
  return MediaModel.findOne(tenantFilter(organizationId, { _id: id, deletedAt: null }));
}

export async function listStudentMedia(
  organizationId: string,
  studentId: string,
  extra: Record<string, unknown>,
  skip: number,
  limit: number,
) {
  const filter = tenantFilter(organizationId, { studentId, deletedAt: null, ...extra });
  const [items, total] = await Promise.all([
    MediaModel.find(filter).sort({ capturedAt: -1, _id: -1 }).skip(skip).limit(limit),
    MediaModel.countDocuments(filter),
  ]);
  return { items, total };
}

export async function softDeleteMedia(organizationId: string, id: string) {
  return MediaModel.findOneAndUpdate(
    tenantFilter(organizationId, { _id: id, deletedAt: null }),
    { deletedAt: new Date() },
    { new: true },
  );
}
