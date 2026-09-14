import type { Request, Response } from 'express';
import { requireAuth } from '../../utils/requireAuth';
import * as authService from './auth.service';

export async function postLogin(req: Request, res: Response): Promise<void> {
  const body = req.body as { email?: unknown; password?: unknown };
  const result = await authService.login(body.email, body.password);
  res.status(200).json(result);
}

export async function postRefresh(req: Request, res: Response): Promise<void> {
  const body = req.body as { refreshToken?: unknown };
  const result = await authService.refresh(body.refreshToken);
  res.status(200).json(result);
}

export async function postLogout(req: Request, res: Response): Promise<void> {
  const body = req.body as { refreshToken?: unknown };
  await authService.logout(body.refreshToken);
  res.status(204).send();
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  const result = await authService.getMe(auth.userId, auth.organizationId);
  res.status(200).json(result);
}
