import type { Request, Response } from 'express';
import { DEFAULT_TIMEZONE } from '../organizations/organization.model';
import { paginated, requireObjectId } from '../../utils/validate';
import { requireAuth } from '../../utils/requireAuth';
import * as busService from './bus.service';
import * as ops from './transport-ops.service';
import {
  parseArrivalBody,
  parseBoardingBody,
  parseCancelBody,
  parseCreateAssignment,
  parseCreateBus,
  parseCreateRoute,
  parseCreateSegment,
  parseCreateStop,
  parseListQuery,
  parsePatchAssignment,
  parsePatchBus,
  parsePatchRoute,
  parsePatchSegment,
  parsePatchStop,
  parsePatchToday,
  parsePickupBody,
  parseProgressBody,
  parseRouteStudent,
} from './bus.validation';

function tz(req: Request): string {
  return req.tenantTimezone || DEFAULT_TIMEZONE;
}

export async function postBus(req: Request, res: Response): Promise<void> {
  const bus = await busService.createBusRecord(requireAuth(req), parseCreateBus(req.body));
  res.status(201).json(busService.toBusJson(bus));
}

export async function getBuses(req: Request, res: Response): Promise<void> {
  const query = parseListQuery(req.query as Record<string, unknown>);
  const result = await busService.listBusRecords(requireAuth(req), query);
  res
    .status(200)
    .json(paginated(result.items.map(busService.toBusJson), query.page, query.limit, result.total));
}

export async function getBus(req: Request, res: Response): Promise<void> {
  const bus = await busService.getBusRecord(requireAuth(req), req.params.busId);
  res.status(200).json(busService.toBusJson(bus));
}

export async function patchBus(req: Request, res: Response): Promise<void> {
  const bus = await busService.patchBusRecord(
    requireAuth(req),
    req.params.busId,
    parsePatchBus(req.body),
  );
  res.status(200).json(busService.toBusJson(bus));
}

export async function postRoute(req: Request, res: Response): Promise<void> {
  const route = await busService.createRouteRecord(requireAuth(req), parseCreateRoute(req.body));
  res.status(201).json(busService.toRouteJson(route));
}

export async function getRoutes(req: Request, res: Response): Promise<void> {
  const query = parseListQuery(req.query as Record<string, unknown>);
  const result = await busService.listRouteRecords(requireAuth(req), query);
  res
    .status(200)
    .json(
      paginated(result.items.map(busService.toRouteJson), query.page, query.limit, result.total),
    );
}

export async function getRoute(req: Request, res: Response): Promise<void> {
  const route = await busService.getRouteRecord(requireAuth(req), req.params.routeId);
  res.status(200).json(busService.toRouteJson(route));
}

export async function patchRoute(req: Request, res: Response): Promise<void> {
  const route = await busService.patchRouteRecord(
    requireAuth(req),
    req.params.routeId,
    parsePatchRoute(req.body),
  );
  res.status(200).json(busService.toRouteJson(route));
}

export async function postStop(req: Request, res: Response): Promise<void> {
  const stop = await busService.addStop(
    requireAuth(req),
    req.params.routeId,
    parseCreateStop(req.body),
  );
  res.status(201).json(busService.toStopJson(stop));
}

export async function getStops(req: Request, res: Response): Promise<void> {
  const stops = await busService.listStops(requireAuth(req), req.params.routeId);
  res.status(200).json({ data: stops.map(busService.toStopJson) });
}

export async function patchStop(req: Request, res: Response): Promise<void> {
  const stop = await busService.patchStopRecord(
    requireAuth(req),
    req.params.stopId,
    parsePatchStop(req.body),
  );
  res.status(200).json(busService.toStopJson(stop));
}

export async function deleteStop(req: Request, res: Response): Promise<void> {
  await busService.removeStop(requireAuth(req), req.params.stopId);
  res.status(204).send();
}

export async function postSegment(req: Request, res: Response): Promise<void> {
  const segment = await busService.addSegment(
    requireAuth(req),
    req.params.routeId,
    parseCreateSegment(req.body),
  );
  res.status(201).json(busService.toSegmentJson(segment));
}

export async function getSegments(req: Request, res: Response): Promise<void> {
  const segments = await busService.listSegments(requireAuth(req), req.params.routeId);
  res.status(200).json({ data: segments.map(busService.toSegmentJson) });
}

export async function patchSegment(req: Request, res: Response): Promise<void> {
  const segment = await busService.patchSegmentRecord(
    requireAuth(req),
    req.params.segmentId,
    parsePatchSegment(req.body),
  );
  res.status(200).json(busService.toSegmentJson(segment));
}

export async function getRouteStudents(req: Request, res: Response): Promise<void> {
  const result = await busService.listRouteStudents(requireAuth(req), req.params.routeId);
  res.status(200).json(result);
}

export async function postRouteStudent(req: Request, res: Response): Promise<void> {
  const assignment = await busService.addRouteStudent(
    requireAuth(req),
    req.params.routeId,
    parseRouteStudent(req.body),
    tz(req),
  );
  res.status(201).json(busService.toAssignmentJson(assignment));
}

export async function deleteRouteStudent(req: Request, res: Response): Promise<void> {
  await busService.removeRouteStudent(requireAuth(req), req.params.routeId, req.params.studentId);
  res.status(204).send();
}

export async function postStudentTransport(req: Request, res: Response): Promise<void> {
  const assignment = await busService.createStudentAssignment(
    requireAuth(req),
    req.params.studentId,
    parseCreateAssignment(req.body),
    tz(req),
  );
  res.status(201).json(busService.toAssignmentJson(assignment));
}

export async function getStudentTransport(req: Request, res: Response): Promise<void> {
  const rows = await busService.listStudentAssignments(requireAuth(req), req.params.studentId);
  res.status(200).json({ data: rows.map(busService.toAssignmentJson) });
}

export async function patchStudentTransport(req: Request, res: Response): Promise<void> {
  const row = await busService.patchStudentAssignment(
    requireAuth(req),
    req.params.studentId,
    req.params.assignmentId,
    parsePatchAssignment(req.body),
  );
  res.status(200).json(busService.toAssignmentJson(row));
}

export async function deleteStudentTransport(req: Request, res: Response): Promise<void> {
  await busService.deleteStudentAssignment(
    requireAuth(req),
    req.params.studentId,
    req.params.assignmentId,
  );
  res.status(204).send();
}

export async function getStudentTransportToday(req: Request, res: Response): Promise<void> {
  const result = await ops.getStudentTransportToday(
    requireAuth(req),
    req.params.studentId,
    tz(req),
  );
  res.status(200).json(result);
}

export async function patchStudentTransportToday(req: Request, res: Response): Promise<void> {
  const result = await ops.patchStudentTransportToday(
    requireAuth(req),
    req.params.studentId,
    parsePatchToday(req.body),
    tz(req),
  );
  res.status(200).json(result);
}

export async function postProgress(req: Request, res: Response): Promise<void> {
  const result = await ops.recordProgress(
    requireAuth(req),
    req.params.routeId,
    parseProgressBody(req.body),
    tz(req),
  );
  res.status(201).json(result);
}

export async function getProgressToday(req: Request, res: Response): Promise<void> {
  const result = await ops.getProgressToday(requireAuth(req), req.params.routeId, tz(req));
  res.status(200).json(result);
}

export async function postBoardingScan(req: Request, res: Response): Promise<void> {
  const result = await ops.scanBoarding(
    requireAuth(req),
    parseBoardingBody(req.body).qrToken,
    tz(req),
  );
  res.status(result.status === 'RECORDED' ? 201 : 200).json(result);
}

export async function postRegisterArrivals(req: Request, res: Response): Promise<void> {
  const result = await ops.registerRouteArrivals(requireAuth(req), req.params.routeId, tz(req));
  res.status(200).json(result);
}

export async function postArrival(req: Request, res: Response): Promise<void> {
  const result = await ops.recordStudentArrival(
    requireAuth(req),
    req.params.studentId,
    parseArrivalBody(req.body),
    tz(req),
  );
  res.status(result.status === 'RECORDED' ? 201 : 200).json(result);
}

export async function postPickup(req: Request, res: Response): Promise<void> {
  const result = await ops.recordPickup(
    requireAuth(req),
    req.params.studentId,
    parsePickupBody(req.body),
    tz(req),
  );
  res.status(201).json(result);
}

export async function getClassroomToday(req: Request, res: Response): Promise<void> {
  const result = await ops.classroomToday(
    requireAuth(req),
    requireObjectId(req.params.classroomId, 'classroomId'),
    tz(req),
  );
  res.status(200).json(result);
}

export async function postParentCancel(req: Request, res: Response): Promise<void> {
  const result = await ops.cancelParentTransport(
    requireAuth(req),
    req.params.studentId,
    parseCancelBody(req.body),
    tz(req),
  );
  res.status(200).json(result);
}

export async function getParentTransportToday(req: Request, res: Response): Promise<void> {
  const result = await ops.getParentTransportToday(requireAuth(req), req.params.studentId, tz(req));
  res.status(200).json(result);
}

export async function getParentEta(req: Request, res: Response): Promise<void> {
  const result = await ops.getParentEta(requireAuth(req), req.params.studentId, tz(req));
  res.status(200).json(result);
}
