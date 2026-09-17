import type { Request, Response } from 'express';
import { AppError } from '../../utils/appError';
import { paginated } from '../../utils/validate';
import { requireAuth } from '../../utils/requireAuth';
import * as userService from './user.service';
import {
  parseCreateUser,
  parseInviteUser,
  parseListUsersQuery,
  parsePatchUser,
} from './user.validation';

export async function getUsers(req: Request, res: Response): Promise<void> {
  const { page, limit, skip, ...filter } = parseListUsersQuery(req.query as Record<string, unknown>);
  const result = await userService.list(requireAuth(req), filter, skip, limit);
  res.status(200).json(paginated(result.items, page, limit, result.total));
}

export async function postUser(req: Request, res: Response): Promise<void> {
  const body = req.body as Record<string, unknown>;
  if (body.role === 'PLATFORM_ADMIN') {
    throw new AppError(422, 'USER_ROLE_NOT_ALLOWED', 'Role is not allowed', [
      { field: 'role', message: 'PLATFORM_ADMIN cannot be created via tenant API' },
    ]);
  }
  const parsed = parseCreateUser(body);
  const result = await userService.create(requireAuth(req), parsed, req);
  if ('invitation' in result) {
    res.status(201).json(result);
    return;
  }
  res.status(201).json(result);
}

export async function getUser(req: Request, res: Response): Promise<void> {
  const user = await userService.getById(requireAuth(req), req.params.userId);
  res.status(200).json(user);
}

export async function patchUser(req: Request, res: Response): Promise<void> {
  const user = await userService.patch(
    requireAuth(req),
    req.params.userId,
    parsePatchUser(req.body as Record<string, unknown>),
  );
  res.status(200).json(user);
}

export async function postDisableUser(req: Request, res: Response): Promise<void> {
  const user = await userService.disable(requireAuth(req), req.params.userId);
  res.status(200).json(user);
}

export async function postEnableUser(req: Request, res: Response): Promise<void> {
  const user = await userService.enable(requireAuth(req), req.params.userId);
  res.status(200).json(user);
}

export async function postUserInvitation(req: Request, res: Response): Promise<void> {
  void parseInviteUser(req.body as Record<string, unknown>);
  const result = await userService.resendInvitation(requireAuth(req), req.params.userId, req);
  res.status(201).json(result);
}
