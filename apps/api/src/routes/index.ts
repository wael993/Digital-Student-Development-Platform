import { Router } from 'express';
import { env } from '../config/env';
import { authRouter } from '../modules/auth/auth.routes';
import { healthRouter } from '../modules/health/health.routes';
import { organizationsRouter } from '../modules/organizations/organizations.routes';
import { tenancyRouter } from '../modules/tenancy/tenancy.routes';

export const v1Router = Router();

v1Router.use('/health', healthRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/organizations', organizationsRouter);

if (env.nodeEnv !== 'production') {
  v1Router.use('/test', tenancyRouter);
}
