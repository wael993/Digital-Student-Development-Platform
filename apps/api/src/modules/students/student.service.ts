import type { AuthContext } from '../../types';
import { assertAssigned } from '../../authorization/scope';
import { notFound, validationError } from '../../utils/validate';
import { findCampusById } from '../campuses/campus.repository';
import { findClassroomById, findClassroomsByIds } from '../classrooms/classroom.repository';
import { listLinksByStudentIds, listStudentIdsForGuardian } from '../guardians/guardian.repository';
import { findUsersByIds } from '../users/user.repository';
import {
  createStudent,
  findStudentById,
  listStudents,
  randomQrToken,
  updateStudent,
} from './student.repository';
import { escapeRegex } from './student.validation';
import type { Student, StudentGender, StudentStatus } from './student.model';

export function toStudentJson(
  student: Student & { id: string },
  extras?: {
    classroomName?: string;
    guardians?: ReturnType<typeof toGuardianSummary>[];
    includeQrToken?: boolean;
  },
) {
  return {
    id: student.id,
    organizationId: String(student.organizationId),
    campusId: String(student.campusId),
    classroomId: String(student.classroomId),
    classroomName: extras?.classroomName,
    firstName: student.firstName,
    lastName: student.lastName,
    dateOfBirth: student.dateOfBirth.toISOString(),
    gender: student.gender,
    studentNumber: student.studentNumber,
    status: student.status,
    ...(extras?.includeQrToken ? { qrToken: student.qrToken } : {}),
    createdAt: student.createdAt,
    updatedAt: student.updatedAt,
    ...(extras?.guardians ? { guardians: extras.guardians } : {}),
  };
}

export function shouldExposeQrToken(role: AuthContext['role']): boolean {
  return role !== 'GUARDIAN' && role !== 'DRIVER';
}

export function toGuardianSummary(link: {
  userId: { toString(): string };
  relationship: string;
  isPrimary: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
}) {
  return {
    userId: String(link.userId),
    firstName: link.firstName,
    lastName: link.lastName,
    email: link.email,
    relationship: link.relationship,
    isPrimary: link.isPrimary,
  };
}

export async function create(
  auth: AuthContext,
  input: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: StudentGender;
    studentNumber: string;
    classroomId: string;
    campusId?: string;
    status?: StudentStatus;
  },
) {
  const classroom = await requireActiveClassroom(auth.organizationId, input.classroomId);
  if (auth.role === 'SUPERVISOR') {
    assertAssigned(auth, String(classroom.campusId), auth.campusIds);
  }
  if (input.campusId && input.campusId !== String(classroom.campusId)) {
    throw validationError('campusId', 'Must match the classroom campus');
  }
  await requireActiveCampus(auth.organizationId, String(classroom.campusId));

  return createStudent(auth.organizationId, {
    ...input,
    campusId: String(classroom.campusId),
    qrToken: randomQrToken(),
  });
}

export async function getById(auth: AuthContext, id: string) {
  const student = await findStudentById(auth.organizationId, id);
  if (!student) {
    throw notFound();
  }
  await assertStudentReadable(auth, student);
  const [classroom, links] = await Promise.all([
    findClassroomById(auth.organizationId, String(student.classroomId)),
    listLinksByStudentIds(auth.organizationId, [student.id]),
  ]);
  const users = await findUsersByIds(
    auth.organizationId,
    links.map((link) => String(link.userId)),
  );
  const byId = new Map(users.map((user) => [user.id, user]));
  return toStudentJson(student, {
    classroomName: classroom?.name,
    includeQrToken: shouldExposeQrToken(auth.role),
    guardians: links.map((link) => {
      const user = byId.get(String(link.userId));
      return toGuardianSummary({
        userId: link.userId,
        relationship: link.relationship,
        isPrimary: link.isPrimary,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
      });
    }),
  });
}

export async function list(
  auth: AuthContext,
  opts: {
    classroomId?: string;
    campusId?: string;
    search?: string;
    status?: StudentStatus;
    page: number;
    limit: number;
    skip: number;
  },
) {
  const extra = await studentListFilter(auth, opts);
  if (extra === null) {
    return {
      items: [] as ReturnType<typeof toStudentJson>[],
      total: 0,
      page: opts.page,
      limit: opts.limit,
    };
  }
  const result = await listStudents(auth.organizationId, extra, opts.skip, opts.limit);
  const classIds = [...new Set(result.items.map((student) => String(student.classroomId)))];
  const classrooms = await findClassroomsByIds(auth.organizationId, classIds);
  const names = new Map(classrooms.map((classroom) => [classroom.id, classroom.name]));
  return {
    items: result.items.map((student) =>
      toStudentJson(student, {
        classroomName: names.get(String(student.classroomId)),
        includeQrToken: shouldExposeQrToken(auth.role),
      }),
    ),
    total: result.total,
    page: opts.page,
    limit: opts.limit,
  };
}

export async function patch(
  auth: AuthContext,
  id: string,
  input: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    gender?: StudentGender;
    studentNumber?: string;
    classroomId?: string;
    campusId?: string;
    status?: StudentStatus;
  },
) {
  const existing = await findStudentById(auth.organizationId, id);
  if (!existing) {
    throw notFound();
  }
  if (auth.role === 'SUPERVISOR') {
    assertAssigned(auth, String(existing.campusId), auth.campusIds);
  }

  let campusId = input.campusId;
  if (input.classroomId) {
    const classroom = await requireActiveClassroom(auth.organizationId, input.classroomId);
    if (auth.role === 'SUPERVISOR') {
      assertAssigned(auth, String(classroom.campusId), auth.campusIds);
    }
    campusId = String(classroom.campusId);
  } else if (input.campusId && input.campusId !== String(existing.campusId)) {
    throw validationError('campusId', 'Change classroom to move campus');
  }

  const updated = await updateStudent(auth.organizationId, id, { ...input, campusId });
  if (!updated) {
    throw notFound();
  }
  return updated;
}

async function studentListFilter(
  auth: AuthContext,
  opts: { classroomId?: string; campusId?: string; search?: string; status?: StudentStatus },
): Promise<Record<string, unknown> | null> {
  const extra: Record<string, unknown> = {};
  if (opts.classroomId) extra.classroomId = opts.classroomId;
  if (opts.campusId) extra.campusId = opts.campusId;
  if (opts.status) extra.status = opts.status;
  if (opts.search) {
    const rx = new RegExp(escapeRegex(opts.search), 'i');
    extra.$or = [{ firstName: rx }, { lastName: rx }, { studentNumber: rx }];
  }

  if (auth.role === 'ADMIN') {
    return extra;
  }
  if (auth.role === 'SUPERVISOR') {
    if (auth.campusIds.length === 0) return null;
    if (opts.campusId && !auth.campusIds.includes(opts.campusId)) return null;
    extra.campusId = opts.campusId ?? { $in: auth.campusIds };
    return extra;
  }
  if (auth.role === 'TEACHER') {
    if (auth.classroomIds.length === 0) return null;
    if (opts.classroomId && !auth.classroomIds.includes(opts.classroomId)) return null;
    extra.classroomId = opts.classroomId ?? { $in: auth.classroomIds };
    return extra;
  }
  if (auth.role === 'GUARDIAN') {
    const ids = await listStudentIdsForGuardian(auth.organizationId, auth.userId);
    if (ids.length === 0) return null;
    extra._id = { $in: ids };
    return extra;
  }
  return null;
}

export async function assertStudentReadable(
  auth: AuthContext,
  student: Student & { id: string },
): Promise<void> {
  if (auth.role === 'ADMIN') {
    return;
  }
  if (auth.role === 'SUPERVISOR') {
    assertAssigned(auth, String(student.campusId), auth.campusIds);
    return;
  }
  if (auth.role === 'TEACHER') {
    assertAssigned(auth, String(student.classroomId), auth.classroomIds);
    return;
  }
  if (auth.role === 'GUARDIAN') {
    const ids = await listStudentIdsForGuardian(auth.organizationId, auth.userId);
    assertAssigned(auth, student.id, ids);
    return;
  }
  throw notFound();
}

async function requireActiveClassroom(organizationId: string, classroomId: string) {
  const classroom = await findClassroomById(organizationId, classroomId);
  if (!classroom) {
    throw validationError('classroomId', 'Classroom not found');
  }
  if (classroom.status !== 'ACTIVE') {
    throw validationError('classroomId', 'Classroom is not active');
  }
  return classroom;
}

async function requireActiveCampus(organizationId: string, campusId: string) {
  const campus = await findCampusById(organizationId, campusId);
  if (!campus) {
    throw validationError('campusId', 'Campus not found');
  }
  if (campus.status !== 'ACTIVE') {
    throw validationError('campusId', 'Campus is not active');
  }
}
