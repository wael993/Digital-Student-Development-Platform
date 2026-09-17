import mongoose, { Schema } from 'mongoose';
import type { UserRole } from '../../types';

export const AUDIT_ACTIONS = [
  'TENANT_CREATED',
  'TENANT_UPDATED',
  'TENANT_ACTIVATED',
  'TENANT_SUSPENDED',
  'TENANT_DEACTIVATED',
  'TENANT_CANCELLED',
  'SUBSCRIPTION_CHANGED',
  'ADMIN_INVITED',
  'ADMIN_INVITATION_ACCEPTED',
  'ADMIN_INVITATION_REVOKED',
  'USER_CREATED',
  'USER_DISABLED',
  'PLATFORM_ADMIN_CREATED',
  'PLATFORM_ADMIN_LOGIN',
  'PLATFORM_ADMIN_LOGIN_FAILED',
  'PLATFORM_ADMIN_DISABLED',
  'PLATFORM_ADMIN_PASSWORD_CHANGED',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface AuditLog {
  actorUserId: mongoose.Types.ObjectId;
  actorRole: UserRole;
  organizationId?: mongoose.Types.ObjectId | null;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<AuditLog>(
  {
    actorUserId: { type: Schema.Types.ObjectId, required: true, index: true },
    actorRole: { type: String, required: true },
    organizationId: { type: Schema.Types.ObjectId, default: null, index: true },
    action: { type: String, required: true, enum: AUDIT_ACTIONS },
    resourceType: { type: String, required: true },
    resourceId: { type: String },
    metadata: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true, collection: 'audit_logs' },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLogModel =
  mongoose.models.AuditLog ?? mongoose.model<AuditLog>('AuditLog', auditLogSchema);
