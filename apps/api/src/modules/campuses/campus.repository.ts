import { tenantFilter, withTenant } from '../../data/tenant';
import { CampusModel, type CampusStatus } from './campus.model';

export async function createCampus(
  organizationId: string,
  input: { name: string; status?: CampusStatus },
) {
  return CampusModel.create(withTenant(input, organizationId));
}

export async function findCampusById(organizationId: string, id: string) {
  return CampusModel.findOne(tenantFilter(organizationId, { _id: id }));
}

export async function findCampusesByIds(organizationId: string, ids: string[]) {
  if (ids.length === 0) {
    return [];
  }
  return CampusModel.find(tenantFilter(organizationId, { _id: { $in: ids } }));
}

export async function listCampuses(
  organizationId: string,
  extra: Record<string, unknown>,
  skip: number,
  limit: number,
) {
  const filter = tenantFilter(organizationId, extra);
  const [items, total] = await Promise.all([
    CampusModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    CampusModel.countDocuments(filter),
  ]);
  return { items, total };
}

export async function updateCampus(
  organizationId: string,
  id: string,
  patch: { name?: string; status?: CampusStatus },
) {
  return CampusModel.findOneAndUpdate(tenantFilter(organizationId, { _id: id }), patch, {
    new: true,
  });
}
