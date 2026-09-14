import type { AuthContext } from '../types';
import { AppError } from '../utils/appError';

function notFound(): AppError {
  return new AppError(404, 'NOT_FOUND', 'Not Found');
}

/** Cross-tenant ids look like missing rows. */
export function assertSameTenant(auth: AuthContext, organizationId: string): void {
  if (auth.organizationId !== String(organizationId)) {
    throw notFound();
  }
}

/**
 * Resource-level check after RBAC. ADMIN is org-wide.
 * Every other role must have `resourceId` in `assignedIds`.
 * Empty assignedIds means no access, not all access.
 *
 * STUDENT-001 / BUS-001 compute assignedIds from the role:
 * guardian → linked children, teacher → classroom students, driver → route students.
 */
export function assertAssigned(auth: AuthContext, resourceId: string, assignedIds: string[]): void {
  if (auth.role === 'ADMIN') {
    return;
  }
  const allowed = assignedIds.map(String);
  if (!allowed.includes(String(resourceId))) {
    throw notFound();
  }
}
