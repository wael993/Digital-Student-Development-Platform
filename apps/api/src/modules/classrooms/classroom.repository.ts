import { tenantFilter, withTenant } from '../../data/tenant';
import { ClassroomModel, type ClassroomLevel, type ClassroomStatus } from './classroom.model';

export async function createClassroom(
  organizationId: string,
  input: {
    campusId: string;
    name: string;
    level: ClassroomLevel;
    status?: ClassroomStatus;
    teacherIds?: string[];
  },
) {
  return ClassroomModel.create(withTenant(input, organizationId));
}

export async function findClassroomById(organizationId: string, id: string) {
  return ClassroomModel.findOne(tenantFilter(organizationId, { _id: id }));
}

export async function findClassroomsByIds(organizationId: string, ids: string[]) {
  if (ids.length === 0) {
    return [];
  }
  return ClassroomModel.find(tenantFilter(organizationId, { _id: { $in: ids } }));
}

export async function listClassrooms(
  organizationId: string,
  extra: Record<string, unknown>,
  skip: number,
  limit: number,
) {
  const filter = tenantFilter(organizationId, extra);
  const [items, total] = await Promise.all([
    ClassroomModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    ClassroomModel.countDocuments(filter),
  ]);
  return { items, total };
}

export async function updateClassroom(
  organizationId: string,
  id: string,
  patch: {
    name?: string;
    level?: ClassroomLevel;
    status?: ClassroomStatus;
    campusId?: string;
    teacherIds?: string[];
  },
) {
  return ClassroomModel.findOneAndUpdate(tenantFilter(organizationId, { _id: id }), patch, {
    new: true,
  });
}
