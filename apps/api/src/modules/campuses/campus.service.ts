import type { AuthContext } from '../../types';
import { assertAssigned } from '../../authorization/scope';
import { notFound } from '../../utils/validate';
import { findClassroomsByIds } from '../classrooms/classroom.repository';
import { createCampus, findCampusById, listCampuses, updateCampus } from './campus.repository';
import type { Campus, CampusStatus } from './campus.model';

export function toCampusJson(campus: Campus & { id: string }) {
  return {
    id: campus.id,
    organizationId: String(campus.organizationId),
    name: campus.name,
    status: campus.status,
    createdAt: campus.createdAt,
    updatedAt: campus.updatedAt,
  };
}

export async function create(auth: AuthContext, input: { name: string; status?: CampusStatus }) {
  return createCampus(auth.organizationId, input);
}

export async function getById(auth: AuthContext, id: string) {
  const campus = await findCampusById(auth.organizationId, id);
  if (!campus) {
    throw notFound();
  }
  await assertCampusReadable(auth, campus.id);
  return campus;
}

export async function list(auth: AuthContext, page: number, limit: number, skip: number) {
  const extra = await campusListFilter(auth);
  if (extra === null) {
    return { items: [], total: 0, page, limit };
  }
  const result = await listCampuses(auth.organizationId, extra, skip, limit);
  return { ...result, page, limit };
}

export async function patch(
  auth: AuthContext,
  id: string,
  input: { name?: string; status?: CampusStatus },
) {
  const existing = await findCampusById(auth.organizationId, id);
  if (!existing) {
    throw notFound();
  }
  assertAssigned(auth, existing.id, auth.campusIds);
  const updated = await updateCampus(auth.organizationId, id, input);
  if (!updated) {
    throw notFound();
  }
  return updated;
}

async function campusListFilter(auth: AuthContext): Promise<Record<string, unknown> | null> {
  if (auth.role === 'ADMIN') {
    return {};
  }
  if (auth.role === 'SUPERVISOR') {
    if (auth.campusIds.length === 0) {
      return null;
    }
    return { _id: { $in: auth.campusIds } };
  }
  if (auth.role === 'TEACHER') {
    const campusIds = await teacherCampusIds(auth);
    if (campusIds.length === 0) {
      return null;
    }
    return { _id: { $in: campusIds } };
  }
  return null;
}

async function assertCampusReadable(auth: AuthContext, campusId: string): Promise<void> {
  if (auth.role === 'ADMIN') {
    return;
  }
  if (auth.role === 'SUPERVISOR') {
    assertAssigned(auth, campusId, auth.campusIds);
    return;
  }
  if (auth.role === 'TEACHER') {
    assertAssigned(auth, campusId, await teacherCampusIds(auth));
    return;
  }
  throw notFound();
}

async function teacherCampusIds(auth: AuthContext): Promise<string[]> {
  const classrooms = await findClassroomsByIds(auth.organizationId, auth.classroomIds);
  return [...new Set(classrooms.map((classroom) => String(classroom.campusId)))];
}
