import type { AuthContext } from '../../types';
import { assertAssigned } from '../../authorization/scope';
import { notFound, validationError } from '../../utils/validate';
import { findCampusById } from '../campuses/campus.repository';
import { findUsersByIds, replaceClassroomTeachers } from '../users/user.repository';
import {
  createClassroom,
  findClassroomById,
  listClassrooms,
  updateClassroom,
} from './classroom.repository';
import type { Classroom, ClassroomLevel, ClassroomStatus } from './classroom.model';
import { updateStudentsCampus } from '../students/student.repository';

export function toClassroomJson(classroom: Classroom & { id: string }) {
  return {
    id: classroom.id,
    organizationId: String(classroom.organizationId),
    campusId: String(classroom.campusId),
    name: classroom.name,
    level: classroom.level,
    status: classroom.status,
    teacherIds: classroom.teacherIds.map(String),
    createdAt: classroom.createdAt,
    updatedAt: classroom.updatedAt,
  };
}

export async function create(
  auth: AuthContext,
  input: {
    campusId: string;
    name: string;
    level: ClassroomLevel;
    status?: ClassroomStatus;
    teacherIds?: string[];
  },
) {
  await requireActiveCampus(auth, input.campusId);
  if (auth.role === 'SUPERVISOR') {
    assertAssigned(auth, input.campusId, auth.campusIds);
  }
  const teacherIds = await requireTeachers(auth.organizationId, input.teacherIds);
  const classroom = await createClassroom(auth.organizationId, { ...input, teacherIds });
  if (teacherIds.length > 0) {
    await replaceClassroomTeachers(auth.organizationId, classroom.id, teacherIds);
  }
  return classroom;
}

export async function getById(auth: AuthContext, id: string) {
  const classroom = await findClassroomById(auth.organizationId, id);
  if (!classroom) {
    throw notFound();
  }
  assertClassroomReadable(auth, classroom);
  return classroom;
}

export async function list(
  auth: AuthContext,
  opts: { campusId?: string; page: number; limit: number; skip: number },
) {
  const extra = classroomListFilter(auth, opts.campusId);
  if (extra === null) {
    return { items: [], total: 0, page: opts.page, limit: opts.limit };
  }
  const result = await listClassrooms(auth.organizationId, extra, opts.skip, opts.limit);
  return { ...result, page: opts.page, limit: opts.limit };
}

export async function patch(
  auth: AuthContext,
  id: string,
  input: {
    campusId?: string;
    name?: string;
    level?: ClassroomLevel;
    status?: ClassroomStatus;
    teacherIds?: string[];
  },
) {
  const existing = await findClassroomById(auth.organizationId, id);
  if (!existing) {
    throw notFound();
  }
  if (auth.role === 'SUPERVISOR') {
    assertAssigned(auth, String(existing.campusId), auth.campusIds);
  }
  if (input.campusId) {
    await requireActiveCampus(auth, input.campusId);
    if (auth.role === 'SUPERVISOR') {
      assertAssigned(auth, input.campusId, auth.campusIds);
    }
  }
  const teacherIds =
    input.teacherIds === undefined
      ? undefined
      : await requireTeachers(auth.organizationId, input.teacherIds);

  const updated = await updateClassroom(auth.organizationId, id, {
    ...input,
    teacherIds,
  });
  if (!updated) {
    throw notFound();
  }

  if (teacherIds) {
    await replaceClassroomTeachers(auth.organizationId, updated.id, teacherIds);
  }

  if (input.campusId && input.campusId !== String(existing.campusId)) {
    await updateStudentsCampus(auth.organizationId, updated.id, input.campusId);
  }

  return updated;
}

function classroomListFilter(auth: AuthContext, campusId?: string): Record<string, unknown> | null {
  const extra: Record<string, unknown> = {};
  if (campusId) {
    extra.campusId = campusId;
  }

  if (auth.role === 'ADMIN') {
    return extra;
  }
  if (auth.role === 'SUPERVISOR') {
    if (auth.campusIds.length === 0) {
      return null;
    }
    extra.campusId = campusId ?? { $in: auth.campusIds };
    if (campusId && !auth.campusIds.includes(campusId)) {
      return null;
    }
    return extra;
  }
  if (auth.role === 'TEACHER') {
    if (auth.classroomIds.length === 0) {
      return null;
    }
    extra._id = { $in: auth.classroomIds };
    return extra;
  }
  return null;
}

function assertClassroomReadable(auth: AuthContext, classroom: Classroom & { id: string }): void {
  if (auth.role === 'ADMIN') {
    return;
  }
  if (auth.role === 'SUPERVISOR') {
    assertAssigned(auth, String(classroom.campusId), auth.campusIds);
    return;
  }
  if (auth.role === 'TEACHER') {
    assertAssigned(auth, classroom.id, auth.classroomIds);
    return;
  }
  throw notFound();
}

async function requireActiveCampus(auth: AuthContext, campusId: string): Promise<void> {
  const campus = await findCampusById(auth.organizationId, campusId);
  if (!campus) {
    throw validationError('campusId', 'Campus not found');
  }
  if (campus.status !== 'ACTIVE') {
    throw validationError('campusId', 'Campus is not active');
  }
}

async function requireTeachers(organizationId: string, teacherIds?: string[]): Promise<string[]> {
  if (!teacherIds || teacherIds.length === 0) {
    return [];
  }
  const users = await findUsersByIds(organizationId, teacherIds);
  if (users.length !== teacherIds.length || users.some((user) => user.role !== 'TEACHER')) {
    throw validationError('teacherIds', 'Each id must be a teacher in this organization');
  }
  return teacherIds;
}
