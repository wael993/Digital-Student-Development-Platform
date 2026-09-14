import type { Request, Response } from 'express';
import { paginated } from '../../utils/validate';
import { requireAuth } from '../../utils/requireAuth';
import * as classroomService from './classroom.service';
import {
  parseClassroomListQuery,
  parseCreateClassroom,
  parsePatchClassroom,
} from './classroom.validation';

export async function postClassroom(req: Request, res: Response): Promise<void> {
  const classroom = await classroomService.create(requireAuth(req), parseCreateClassroom(req.body));
  res.status(201).json(classroomService.toClassroomJson(classroom));
}

export async function getClassrooms(req: Request, res: Response): Promise<void> {
  const query = parseClassroomListQuery(req.query);
  const result = await classroomService.list(requireAuth(req), query);
  res
    .status(200)
    .json(
      paginated(
        result.items.map(classroomService.toClassroomJson),
        query.page,
        query.limit,
        result.total,
      ),
    );
}

export async function getClassroom(req: Request, res: Response): Promise<void> {
  const classroom = await classroomService.getById(requireAuth(req), req.params.id);
  res.status(200).json(classroomService.toClassroomJson(classroom));
}

export async function patchClassroom(req: Request, res: Response): Promise<void> {
  const classroom = await classroomService.patch(
    requireAuth(req),
    req.params.id,
    parsePatchClassroom(req.body),
  );
  res.status(200).json(classroomService.toClassroomJson(classroom));
}
