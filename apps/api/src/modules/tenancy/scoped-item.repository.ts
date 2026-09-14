import { tenantFilter, withTenant } from '../../data/tenant';
import { ScopedItemModel } from './scoped-item.model';

export async function createScopedItem(organizationId: string, name: string) {
  return ScopedItemModel.create(withTenant({ name }, organizationId));
}

export async function findScopedItemById(organizationId: string, id: string) {
  return ScopedItemModel.findOne(tenantFilter(organizationId, { _id: id }));
}

export async function listScopedItems(organizationId: string) {
  return ScopedItemModel.find(tenantFilter(organizationId)).sort({ createdAt: -1 });
}

export async function updateScopedItem(organizationId: string, id: string, name: string) {
  return ScopedItemModel.findOneAndUpdate(
    tenantFilter(organizationId, { _id: id }),
    { name },
    { new: true },
  );
}

export async function deleteScopedItem(organizationId: string, id: string) {
  return ScopedItemModel.findOneAndDelete(tenantFilter(organizationId, { _id: id }));
}
