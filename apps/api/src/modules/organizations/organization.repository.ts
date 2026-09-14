import { OrganizationModel, type OrganizationStatus } from './organization.model';

export async function findOrganizationById(id: string) {
  return OrganizationModel.findById(id);
}

export async function createOrganization(input: { name: string; status?: OrganizationStatus }) {
  return OrganizationModel.create(input);
}

export async function updateOrganizationName(id: string, name: string) {
  return OrganizationModel.findByIdAndUpdate(id, { name }, { new: true });
}
