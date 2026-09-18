import type { Request } from 'express';
import type { AuthContext } from '../../types';
import { AuditLogModel, type AuditAction } from './audit.model';

/** Never pass secrets (passwords, JWTs, raw invitation tokens) in metadata. */
export async function writeAuditLog(input: {
  actor: AuthContext;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  organizationId?: string | null;
  metadata?: Record<string, unknown>;
  req?: Request;
}): Promise<void> {
  const rawOrgId =
    input.organizationId !== undefined ? input.organizationId : input.actor.organizationId;
  await AuditLogModel.create({
    actorUserId: input.actor.userId,
    actorRole: input.actor.role,
    organizationId: rawOrgId ? rawOrgId : null,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    metadata: input.metadata,
    ipAddress: input.req?.ip,
    userAgent: input.req?.header('user-agent') ?? undefined,
  });
}

export async function listAuditLogsForOrganization(organizationId: string, skip = 0, limit = 50) {
  const filter = { organizationId };
  const [items, total] = await Promise.all([
    AuditLogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    AuditLogModel.countDocuments(filter),
  ]);
  return { items, total };
}
