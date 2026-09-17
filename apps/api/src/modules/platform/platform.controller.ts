import type { Request, Response } from 'express';
import { AppError } from '../../utils/appError';
import { requireObjectId } from '../../utils/validate';
import { requirePlatformAuth } from '../../utils/requireAuth';
import * as platformService from './platform.service';

export async function postOrganization(req: Request, res: Response): Promise<void> {
  const actor = requirePlatformAuth(req);
  const result = await platformService.createTenant(actor, req.body as Record<string, unknown>, req);
  res.status(201).json(result);
}

export async function getOrganizations(req: Request, res: Response): Promise<void> {
  requirePlatformAuth(req);
  const result = await platformService.listTenants(req.query as Record<string, unknown>);
  res.status(200).json(result);
}

export async function getDashboard(req: Request, res: Response): Promise<void> {
  requirePlatformAuth(req);
  const result = await platformService.getDashboard();
  res.status(200).json(result);
}

export async function getOrganization(req: Request, res: Response): Promise<void> {
  requirePlatformAuth(req);
  const organizationId = requireObjectId(req.params.organizationId, 'organizationId');
  const result = await platformService.getTenant(organizationId);
  res.status(200).json(result);
}

export async function patchOrganization(req: Request, res: Response): Promise<void> {
  const actor = requirePlatformAuth(req);
  const organizationId = requireObjectId(req.params.organizationId, 'organizationId');
  const result = await platformService.patchTenant(
    actor,
    organizationId,
    req.body as Record<string, unknown>,
    req,
  );
  res.status(200).json(result);
}

export async function postActivate(req: Request, res: Response): Promise<void> {
  const actor = requirePlatformAuth(req);
  const organizationId = requireObjectId(req.params.organizationId, 'organizationId');
  const result = await platformService.activateTenant(actor, organizationId, req);
  res.status(200).json(result);
}

export async function postSuspend(req: Request, res: Response): Promise<void> {
  const actor = requirePlatformAuth(req);
  const organizationId = requireObjectId(req.params.organizationId, 'organizationId');
  const result = await platformService.suspendTenant(actor, organizationId, req);
  res.status(200).json(result);
}

export async function postDeactivate(req: Request, res: Response): Promise<void> {
  const actor = requirePlatformAuth(req);
  const organizationId = requireObjectId(req.params.organizationId, 'organizationId');
  const result = await platformService.deactivateTenant(actor, organizationId, req);
  res.status(200).json(result);
}

export async function getSubscription(req: Request, res: Response): Promise<void> {
  requirePlatformAuth(req);
  const organizationId = requireObjectId(req.params.organizationId, 'organizationId');
  const result = await platformService.getSubscription(organizationId);
  res.status(200).json(result);
}

export async function postSubscription(req: Request, res: Response): Promise<void> {
  const actor = requirePlatformAuth(req);
  const organizationId = requireObjectId(req.params.organizationId, 'organizationId');
  const result = await platformService.setSubscription(
    actor,
    organizationId,
    req.body as Record<string, unknown>,
    req,
  );
  res.status(200).json(result);
}

export async function patchSubscription(req: Request, res: Response): Promise<void> {
  const actor = requirePlatformAuth(req);
  const organizationId = requireObjectId(req.params.organizationId, 'organizationId');
  const result = await platformService.setSubscription(
    actor,
    organizationId,
    req.body as Record<string, unknown>,
    req,
  );
  res.status(200).json(result);
}

export async function postAdminInvitation(req: Request, res: Response): Promise<void> {
  const actor = requirePlatformAuth(req);
  const organizationId = requireObjectId(req.params.organizationId, 'organizationId');
  const result = await platformService.inviteAdmin(
    actor,
    organizationId,
    req.body as Record<string, unknown>,
    req,
  );
  res.status(201).json(result);
}

export async function postAcceptInvitation(req: Request, res: Response): Promise<void> {
  const token = req.params.token?.trim();
  if (!token) {
    throw new AppError(422, 'VALIDATION_ERROR', 'token is required', [
      { field: 'token', message: 'Required' },
    ]);
  }
  const result = await platformService.acceptAdminInvitation(
    token,
    req.body as Record<string, unknown>,
  );
  res.status(200).json(result);
}

export async function getUsage(req: Request, res: Response): Promise<void> {
  requirePlatformAuth(req);
  const organizationId = requireObjectId(req.params.organizationId, 'organizationId');
  const result = await platformService.getUsage(organizationId);
  res.status(200).json(result);
}
