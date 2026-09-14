export function tenantFilter(
  organizationId: string,
  extra: Record<string, unknown> = {},
): { organizationId: string } & Record<string, unknown> {
  if (!organizationId) {
    throw new Error('organizationId is required for tenant queries');
  }
  const { organizationId: _ignored, ...rest } = extra;
  return { ...rest, organizationId };
}

/** Client `organizationId` is discarded. Tenant always comes from auth. */
export function withTenant<T extends object>(
  input: T,
  organizationId: string,
): Omit<T, 'organizationId'> & { organizationId: string } {
  if (!organizationId) {
    throw new Error('organizationId is required for tenant writes');
  }
  const { organizationId: _ignored, ...rest } = input as T & { organizationId?: unknown };
  return { ...rest, organizationId };
}
