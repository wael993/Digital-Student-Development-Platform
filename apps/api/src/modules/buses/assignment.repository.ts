import { tenantFilter, withTenant } from '../../data/tenant';
import type { RouteDirection } from './bus-route.model';
import {
  StudentTransportAssignmentModel,
  type StudentTransportAssignment,
} from './student-transport-assignment.model';
import {
  DailyTransportPlanModel,
  type DailyPlanStatus,
  type TransportMethod,
} from './daily-transport-plan.model';

export async function createAssignment(
  organizationId: string,
  input: {
    studentId: string;
    routeId: string;
    stopId: string;
    direction: RouteDirection;
    active?: boolean;
    effectiveFrom: string;
    effectiveTo?: string;
  },
) {
  return StudentTransportAssignmentModel.create(withTenant(input, organizationId));
}

export async function findAssignmentById(organizationId: string, id: string) {
  return StudentTransportAssignmentModel.findOne(tenantFilter(organizationId, { _id: id }));
}

export async function findActiveAssignment(
  organizationId: string,
  studentId: string,
  direction: RouteDirection,
) {
  return StudentTransportAssignmentModel.findOne(
    tenantFilter(organizationId, { studentId, direction, active: true }),
  );
}

export async function listAssignmentsForStudent(organizationId: string, studentId: string) {
  return StudentTransportAssignmentModel.find(tenantFilter(organizationId, { studentId })).sort({
    createdAt: -1,
  });
}

export async function listActiveAssignmentsForRoute(organizationId: string, routeId: string) {
  return StudentTransportAssignmentModel.find(
    tenantFilter(organizationId, { routeId, active: true }),
  );
}

export async function listActiveAssignmentsForStop(organizationId: string, stopId: string) {
  return StudentTransportAssignmentModel.find(
    tenantFilter(organizationId, { stopId, active: true }),
  );
}

export async function listActiveStudentIdsForRoutes(organizationId: string, routeIds: string[]) {
  if (routeIds.length === 0) {
    return [];
  }
  const rows = await StudentTransportAssignmentModel.find(
    tenantFilter(organizationId, { routeId: { $in: routeIds }, active: true }),
  ).select('studentId');
  return [...new Set(rows.map((row) => String(row.studentId)))];
}

export async function countActiveAssignmentsForRoute(organizationId: string, routeId: string) {
  return StudentTransportAssignmentModel.countDocuments(
    tenantFilter(organizationId, { routeId, active: true }),
  );
}

export async function deactivateAssignment(organizationId: string, id: string) {
  return StudentTransportAssignmentModel.findOneAndUpdate(
    tenantFilter(organizationId, { _id: id }),
    { active: false },
    { new: true },
  );
}

export async function deactivateActiveAssignment(
  organizationId: string,
  studentId: string,
  direction: RouteDirection,
) {
  return StudentTransportAssignmentModel.findOneAndUpdate(
    tenantFilter(organizationId, { studentId, direction, active: true }),
    { active: false },
    { new: true },
  );
}

export async function updateAssignment(
  organizationId: string,
  id: string,
  patch: {
    stopId?: string;
    routeId?: string;
    active?: boolean;
    effectiveFrom?: string;
    effectiveTo?: string;
  },
) {
  return StudentTransportAssignmentModel.findOneAndUpdate(
    tenantFilter(organizationId, { _id: id }),
    patch,
    { new: true },
  );
}

export async function deactivateAssignmentsForStop(organizationId: string, stopId: string) {
  await StudentTransportAssignmentModel.updateMany(
    tenantFilter(organizationId, { stopId, active: true }),
    { active: false },
  );
}

export async function upsertDailyPlan(
  organizationId: string,
  input: {
    studentId: string;
    date: string;
    direction: RouteDirection;
    transportMethod: TransportMethod;
    routeId?: string;
    stopId?: string;
    status: DailyPlanStatus;
    reason?: string;
    createdBy: string;
  },
) {
  return DailyTransportPlanModel.findOneAndUpdate(
    tenantFilter(organizationId, {
      studentId: input.studentId,
      date: input.date,
      direction: input.direction,
    }),
    withTenant(input, organizationId),
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

export async function findDailyPlan(
  organizationId: string,
  studentId: string,
  date: string,
  direction: RouteDirection,
) {
  return DailyTransportPlanModel.findOne(
    tenantFilter(organizationId, { studentId, date, direction }),
  );
}

export async function listDailyPlansForStudentDate(
  organizationId: string,
  studentId: string,
  date: string,
) {
  return DailyTransportPlanModel.find(tenantFilter(organizationId, { studentId, date }));
}

export async function listDailyPlansForRouteDate(
  organizationId: string,
  routeId: string,
  date: string,
) {
  return DailyTransportPlanModel.find(tenantFilter(organizationId, { routeId, date }));
}

export async function listCancelledStudentIds(
  organizationId: string,
  studentIds: string[],
  date: string,
  direction: RouteDirection,
) {
  if (studentIds.length === 0) {
    return [];
  }
  const rows = await DailyTransportPlanModel.find(
    tenantFilter(organizationId, {
      studentId: { $in: studentIds },
      date,
      direction,
      status: 'CANCELLED',
    }),
  ).select('studentId');
  return rows.map((row) => String(row.studentId));
}

export type { StudentTransportAssignment };
