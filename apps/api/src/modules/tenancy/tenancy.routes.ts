import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { tenantContext } from '../../middlewares/tenantContext';
import { asyncHandler } from '../../utils/asyncHandler';
import {
  getScopedItem,
  getScopedItems,
  getTenantProbe,
  patchScopedItem,
  postScopedItem,
  removeScopedItem,
} from './tenancy.controller';

export const tenancyRouter = Router();

const guarded = [authenticate, tenantContext];

tenancyRouter.get('/tenant', ...guarded, asyncHandler(getTenantProbe));
tenancyRouter.post('/items', ...guarded, asyncHandler(postScopedItem));
tenancyRouter.get('/items', ...guarded, asyncHandler(getScopedItems));
tenancyRouter.get('/items/:id', ...guarded, asyncHandler(getScopedItem));
tenancyRouter.patch('/items/:id', ...guarded, asyncHandler(patchScopedItem));
tenancyRouter.delete('/items/:id', ...guarded, asyncHandler(removeScopedItem));
