import { tenantFilter, withTenant } from '../../data/tenant';
import { BusModel, type BusStatus } from './bus.model';
import { BusRouteModel, type RouteDirection, type RouteStatus } from './bus-route.model';
import { BusStopModel } from './bus-stop.model';
import { RouteSegmentModel } from './route-segment.model';

export async function createBus(
  organizationId: string,
  input: {
    campusId: string;
    name: string;
    registrationNumber: string;
    capacity: number;
    status?: BusStatus;
    driverId?: string;
    supervisorId?: string;
  },
) {
  return BusModel.create(withTenant(input, organizationId));
}

export async function findBusById(organizationId: string, id: string) {
  return BusModel.findOne(tenantFilter(organizationId, { _id: id }));
}

export async function listBuses(
  organizationId: string,
  extra: Record<string, unknown>,
  skip: number,
  limit: number,
) {
  const filter = tenantFilter(organizationId, extra);
  const [items, total] = await Promise.all([
    BusModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    BusModel.countDocuments(filter),
  ]);
  return { items, total };
}

export async function updateBus(
  organizationId: string,
  id: string,
  patch: {
    name?: string;
    registrationNumber?: string;
    capacity?: number;
    status?: BusStatus;
    driverId?: string | null;
    supervisorId?: string | null;
  },
) {
  return BusModel.findOneAndUpdate(tenantFilter(organizationId, { _id: id }), patch, { new: true });
}

export async function createRoute(
  organizationId: string,
  input: {
    campusId: string;
    name: string;
    busId: string;
    direction: RouteDirection;
    status?: RouteStatus;
    estimatedStartTime?: string;
    estimatedEndTime?: string;
  },
) {
  return BusRouteModel.create(withTenant(input, organizationId));
}

export async function findRouteById(organizationId: string, id: string) {
  return BusRouteModel.findOne(tenantFilter(organizationId, { _id: id }));
}

export async function listRoutes(
  organizationId: string,
  extra: Record<string, unknown>,
  skip: number,
  limit: number,
) {
  const filter = tenantFilter(organizationId, extra);
  const [items, total] = await Promise.all([
    BusRouteModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    BusRouteModel.countDocuments(filter),
  ]);
  return { items, total };
}

export async function listRoutesByIds(organizationId: string, ids: string[]) {
  if (ids.length === 0) {
    return [];
  }
  return BusRouteModel.find(tenantFilter(organizationId, { _id: { $in: ids } }));
}

export async function listRouteIdsForBus(organizationId: string, busId: string) {
  const routes = await BusRouteModel.find(tenantFilter(organizationId, { busId })).select('_id');
  return routes.map((route) => String(route._id));
}

export async function updateRoute(
  organizationId: string,
  id: string,
  patch: {
    name?: string;
    busId?: string;
    direction?: RouteDirection;
    status?: RouteStatus;
    estimatedStartTime?: string;
    estimatedEndTime?: string;
  },
) {
  return BusRouteModel.findOneAndUpdate(tenantFilter(organizationId, { _id: id }), patch, {
    new: true,
  });
}

export async function createStop(
  organizationId: string,
  input: {
    routeId: string;
    sequence: number;
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  },
) {
  return BusStopModel.create(withTenant(input, organizationId));
}

export async function findStopById(organizationId: string, id: string) {
  return BusStopModel.findOne(tenantFilter(organizationId, { _id: id }));
}

export async function listStopsForRoute(organizationId: string, routeId: string) {
  return BusStopModel.find(tenantFilter(organizationId, { routeId })).sort({ sequence: 1 });
}

export async function nextStopSequence(organizationId: string, routeId: string) {
  const last = await BusStopModel.findOne(tenantFilter(organizationId, { routeId })).sort({
    sequence: -1,
  });
  return (last?.sequence ?? 0) + 1;
}

export async function updateStop(
  organizationId: string,
  id: string,
  patch: {
    name?: string;
    address?: string;
    sequence?: number;
    latitude?: number;
    longitude?: number;
  },
) {
  return BusStopModel.findOneAndUpdate(tenantFilter(organizationId, { _id: id }), patch, {
    new: true,
  });
}

export async function deleteStop(organizationId: string, id: string) {
  return BusStopModel.findOneAndDelete(tenantFilter(organizationId, { _id: id }));
}

export async function resequenceStops(organizationId: string, routeId: string) {
  const stops = await listStopsForRoute(organizationId, routeId);
  await Promise.all(
    stops.map((stop, index) =>
      BusStopModel.updateOne(tenantFilter(organizationId, { _id: stop.id }), {
        sequence: index + 1,
      }),
    ),
  );
}

export async function createSegment(
  organizationId: string,
  input: {
    routeId: string;
    fromStopId: string;
    toStopId: string;
    estimatedMinutes: number;
  },
) {
  return RouteSegmentModel.create(withTenant(input, organizationId));
}

export async function findSegmentById(organizationId: string, id: string) {
  return RouteSegmentModel.findOne(tenantFilter(organizationId, { _id: id }));
}

export async function findSegment(
  organizationId: string,
  routeId: string,
  fromStopId: string,
  toStopId: string,
) {
  return RouteSegmentModel.findOne(tenantFilter(organizationId, { routeId, fromStopId, toStopId }));
}

export async function listSegmentsForRoute(organizationId: string, routeId: string) {
  return RouteSegmentModel.find(tenantFilter(organizationId, { routeId }));
}

export async function updateSegment(
  organizationId: string,
  id: string,
  patch: { estimatedMinutes?: number },
) {
  return RouteSegmentModel.findOneAndUpdate(tenantFilter(organizationId, { _id: id }), patch, {
    new: true,
  });
}

export async function deleteSegmentsForStop(
  organizationId: string,
  routeId: string,
  stopId: string,
) {
  await RouteSegmentModel.deleteMany(
    tenantFilter(organizationId, {
      routeId,
      $or: [{ fromStopId: stopId }, { toStopId: stopId }],
    }),
  );
}
