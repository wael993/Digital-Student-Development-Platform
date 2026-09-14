import type { Request, Response } from 'express';
import { paginated } from '../../utils/validate';
import { requireAuth } from '../../utils/requireAuth';
import * as guardianService from './guardian.service';
import {
  parseCreateGuardian,
  parseGuardianListQuery,
  parsePatchGuardian,
} from './guardian.validation';

export async function postGuardian(req: Request, res: Response): Promise<void> {
  const user = await guardianService.createGuardianUser(
    requireAuth(req),
    parseCreateGuardian(req.body),
  );
  res.status(201).json(user);
}

export async function getGuardians(req: Request, res: Response): Promise<void> {
  const { page, limit, skip } = parseGuardianListQuery(req.query);
  const result = await guardianService.listGuardians(requireAuth(req), page, limit, skip);
  res.status(200).json(paginated(result.items, page, limit, result.total));
}

export async function getGuardian(req: Request, res: Response): Promise<void> {
  const user = await guardianService.getGuardian(requireAuth(req), req.params.id);
  res.status(200).json(user);
}

export async function patchGuardian(req: Request, res: Response): Promise<void> {
  const user = await guardianService.patchGuardian(
    requireAuth(req),
    req.params.id,
    parsePatchGuardian(req.body),
  );
  res.status(200).json(user);
}
