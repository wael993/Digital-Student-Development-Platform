import type { Request, Response } from 'express';
import { AppError } from '../../utils/appError';
import { requireAuth } from '../../utils/requireAuth';
import {
  createScopedItem,
  deleteScopedItem,
  findScopedItemById,
  listScopedItems,
  updateScopedItem,
} from './scoped-item.repository';

function asName(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
}

function toJson(item: { id: string; organizationId: { toString(): string }; name: string }) {
  return {
    id: item.id,
    organizationId: String(item.organizationId),
    name: item.name,
  };
}

export async function getTenantProbe(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  res.status(200).json({
    userId: auth.userId,
    organizationId: auth.organizationId,
    role: auth.role,
  });
}

export async function postScopedItem(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  const name = asName((req.body as { name?: unknown }).name);
  if (!name) {
    throw new AppError(422, 'VALIDATION_ERROR', 'name is required', [
      { field: 'name', message: 'Required' },
    ]);
  }
  const item = await createScopedItem(auth.organizationId, name);
  res.status(201).json(toJson(item));
}

export async function getScopedItems(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  const items = await listScopedItems(auth.organizationId);
  res.status(200).json({ data: items.map(toJson) });
}

export async function getScopedItem(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  const item = await findScopedItemById(auth.organizationId, req.params.id);
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Not Found');
  }
  res.status(200).json(toJson(item));
}

export async function patchScopedItem(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  const name = asName((req.body as { name?: unknown }).name);
  if (!name) {
    throw new AppError(422, 'VALIDATION_ERROR', 'name is required', [
      { field: 'name', message: 'Required' },
    ]);
  }
  const item = await updateScopedItem(auth.organizationId, req.params.id, name);
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Not Found');
  }
  res.status(200).json(toJson(item));
}

export async function removeScopedItem(req: Request, res: Response): Promise<void> {
  const auth = requireAuth(req);
  const item = await deleteScopedItem(auth.organizationId, req.params.id);
  if (!item) {
    throw new AppError(404, 'NOT_FOUND', 'Not Found');
  }
  res.status(204).send();
}
