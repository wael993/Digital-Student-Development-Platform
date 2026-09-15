import { tenantFilter, withTenant } from '../../data/tenant';
import {
  RouteProgressModel,
  type ProgressSource,
  type StopProgressStatus,
} from './route-progress.model';

export async function createProgress(
  organizationId: string,
  input: {
    routeId: string;
    date: string;
    stopId: string;
    sequence: number;
    status: StopProgressStatus;
    occurredAt: Date;
    recordedBy: string;
    source?: ProgressSource;
    parentsNotified?: boolean;
  },
) {
  return RouteProgressModel.create(withTenant(input, organizationId));
}

export async function listProgressForRouteDate(
  organizationId: string,
  routeId: string,
  date: string,
) {
  return RouteProgressModel.find(tenantFilter(organizationId, { routeId, date })).sort({
    occurredAt: 1,
    _id: 1,
  });
}

export async function findLatestProgressForRoute(
  organizationId: string,
  routeId: string,
  date: string,
) {
  return RouteProgressModel.findOne(tenantFilter(organizationId, { routeId, date })).sort({
    occurredAt: -1,
    _id: -1,
  });
}

export async function hasNotifiedStop(
  organizationId: string,
  routeId: string,
  date: string,
  stopId: string,
) {
  const existing = await RouteProgressModel.findOne(
    tenantFilter(organizationId, { routeId, date, stopId, parentsNotified: true }),
  );
  return Boolean(existing);
}

export async function markProgressNotified(organizationId: string, id: string) {
  return RouteProgressModel.findOneAndUpdate(
    tenantFilter(organizationId, { _id: id }),
    { parentsNotified: true },
    { new: true },
  );
}
