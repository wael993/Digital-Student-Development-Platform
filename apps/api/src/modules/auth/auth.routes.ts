import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { asyncHandler } from '../../utils/asyncHandler';
import { getMe, postLogin, postLogout, postRefresh } from './auth.controller';

export const authRouter = Router();

authRouter.post('/login', asyncHandler(postLogin));
authRouter.post('/refresh', asyncHandler(postRefresh));
authRouter.post('/logout', asyncHandler(postLogout));
authRouter.get('/me', authenticate, asyncHandler(getMe));
