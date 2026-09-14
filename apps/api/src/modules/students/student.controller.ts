import type { Request, Response } from 'express';
import { paginated } from '../../utils/validate';
import { requireAuth } from '../../utils/requireAuth';
import * as studentService from './student.service';
import { parseCreateStudent, parsePatchStudent, parseStudentListQuery } from './student.validation';
import * as guardianService from '../guardians/guardian.service';
import { parseAssociateGuardian } from '../guardians/guardian.validation';

export async function postStudent(req: Request, res: Response): Promise<void> {
  const student = await studentService.create(requireAuth(req), parseCreateStudent(req.body));
  res.status(201).json(
    studentService.toStudentJson(student, {
      includeQrToken: studentService.shouldExposeQrToken(requireAuth(req).role),
    }),
  );
}

export async function getStudents(req: Request, res: Response): Promise<void> {
  const query = parseStudentListQuery(req.query);
  const result = await studentService.list(requireAuth(req), query);
  res.status(200).json(paginated(result.items, query.page, query.limit, result.total));
}

export async function getStudent(req: Request, res: Response): Promise<void> {
  const student = await studentService.getById(requireAuth(req), req.params.id);
  res.status(200).json(student);
}

export async function patchStudent(req: Request, res: Response): Promise<void> {
  const student = await studentService.patch(
    requireAuth(req),
    req.params.id,
    parsePatchStudent(req.body),
  );
  res.status(200).json(
    studentService.toStudentJson(student, {
      includeQrToken: studentService.shouldExposeQrToken(requireAuth(req).role),
    }),
  );
}

export async function getStudentGuardians(req: Request, res: Response): Promise<void> {
  const links = await guardianService.listStudentGuardians(requireAuth(req), req.params.id);
  res.status(200).json({ data: links });
}

export async function postStudentGuardian(req: Request, res: Response): Promise<void> {
  const link = await guardianService.associateGuardian(
    requireAuth(req),
    req.params.id,
    parseAssociateGuardian(req.body),
  );
  res.status(201).json(link);
}

export async function deleteStudentGuardian(req: Request, res: Response): Promise<void> {
  await guardianService.unlinkGuardian(requireAuth(req), req.params.id, req.params.userId);
  res.status(204).send();
}
