import { tenantFilter, withTenant } from '../../data/tenant';
import {
  StudentEventModel,
  type StudentEventSource,
  type StudentEventType,
} from './student-event.model';

export async function createStudentEvent(
  organizationId: string,
  input: {
    studentId: string;
    eventType: StudentEventType;
    occurredAt: Date;
    recordedAt: Date;
    recordedBy: string;
    source: StudentEventSource;
    metadata: Record<string, unknown>;
  },
) {
  return StudentEventModel.create(withTenant(input, organizationId));
}

export async function listStudentEvents(
  organizationId: string,
  studentId: string,
  start: Date,
  endExclusive: Date,
) {
  return StudentEventModel.find(
    tenantFilter(organizationId, {
      studentId,
      occurredAt: { $gte: start, $lt: endExclusive },
    }),
  )
    .sort({ occurredAt: 1, _id: 1 })
    .limit(200);
}

export async function findLatestStudentEvent(
  organizationId: string,
  studentId: string,
  start: Date,
  endExclusive: Date,
) {
  return StudentEventModel.findOne(
    tenantFilter(organizationId, {
      studentId,
      occurredAt: { $gte: start, $lt: endExclusive },
    }),
  ).sort({ occurredAt: -1, _id: -1 });
}

export async function findLatestEventOfType(
  organizationId: string,
  studentId: string,
  eventType: StudentEventType,
  start: Date,
  endExclusive: Date,
) {
  return StudentEventModel.findOne(
    tenantFilter(organizationId, {
      studentId,
      eventType,
      occurredAt: { $gte: start, $lt: endExclusive },
    }),
  ).sort({ occurredAt: -1, _id: -1 });
}

export async function findRecentEventOfType(
  organizationId: string,
  studentId: string,
  eventType: StudentEventType,
  since: Date,
) {
  return StudentEventModel.findOne(
    tenantFilter(organizationId, {
      studentId,
      eventType,
      recordedAt: { $gte: since },
    }),
  ).sort({ recordedAt: -1, _id: -1 });
}
