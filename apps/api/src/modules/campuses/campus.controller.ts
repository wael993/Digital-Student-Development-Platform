import type { Request, Response } from 'express';
import { paginated } from '../../utils/validate';
import { requireAuth } from '../../utils/requireAuth';
import * as campusService from './campus.service';
import { parseCreateCampus, parseListQuery, parsePatchCampus } from './campus.validation';

export async function postCampus(req: Request, res: Response): Promise<void> {
  const campus = await campusService.create(requireAuth(req), parseCreateCampus(req.body));
  res.status(201).json(campusService.toCampusJson(campus));
}

export async function getCampuses(req: Request, res: Response): Promise<void> {
  const { page, limit, skip } = parseListQuery(req.query);
  const result = await campusService.list(requireAuth(req), page, limit, skip);
  res
    .status(200)
    .json(paginated(result.items.map(campusService.toCampusJson), page, limit, result.total));
}

export async function getCampus(req: Request, res: Response): Promise<void> {
  const campus = await campusService.getById(requireAuth(req), req.params.id);
  res.status(200).json(campusService.toCampusJson(campus));
}

export async function patchCampus(req: Request, res: Response): Promise<void> {
  const campus = await campusService.patch(
    requireAuth(req),
    req.params.id,
    parsePatchCampus(req.body),
  );
  res.status(200).json(campusService.toCampusJson(campus));
}
