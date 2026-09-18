# Multi-Tenancy

Every business request belongs to one organization. Isolation is a backend invariant, not a Flutter convention.

Platform administration (PLATFORM-001) is the **only** intentional cross-tenant path. It uses a separate role and router; it does not bypass `tenantFilter` for school data.

## Hierarchy

```
Platform (رحلتي / My Journey)
  └── Organization (tenant)          ← organizationId
        └── Campus
              └── Classroom / Users / Students / …
```

`organizationId` remains the tenant isolation key. Do not invent a second tenant id.

## Model

Shared MongoDB, tenant key on documents:

```json
{
  "_id": "...",
  "organizationId": "...",
  "name": "Sarah"
}
```

`organizations` has no `organizationId`. Users and all operational data do.

### Organization fields (PLATFORM-001)

| Field | Notes |
| --- | --- |
| `name`, `slug` | Slug unique; generated server-side |
| `status` | `TRIAL` \| `ACTIVE` \| `SUSPENDED` \| `INACTIVE` \| `CANCELLED` |
| `country`, `timezone`, `defaultLanguage` | Locale defaults |
| `contactEmail`, `contactPhone` | Operator contacts |
| `planCode` | `STARTER` \| `PROFESSIONAL` \| `ENTERPRISE` (catalog in `SubscriptionService`; no `TenantPlan` collection yet) |
| `subscriptionStatus` | Separate from org status (`NONE` \| `TRIAL` \| `ACTIVE` \| `PAST_DUE` \| `CANCELLED`) |
| `subscriptionStartedAt`, `subscriptionEndsAt`, `trialEndsAt` | Period markers |
| `address`, `website`, `notes`, `logoUrl` | Optional |
| `retentionEndsAt` | Set on cancel; permanent deletion is an explicit later audited operation |

Operational access (login + tenant APIs) requires status `TRIAL` or `ACTIVE`. `SUSPENDED` / `INACTIVE` / `CANCELLED` block tenant users with `TENANT_SUSPENDED` / `TENANT_INACTIVE` / `TENANT_CANCELLED`.

v1: a tenant user has exactly one `organizationId`. A parent with children at two schools is not supported until a `memberships` collection exists.

`PLATFORM_ADMIN` users have **no** tenant `organizationId` (stored as `null`). Provision with `npm run bootstrap:platform-admin` (PLATFORM-002); do not rely on env credentials for ongoing login.

## Request path

### Tenant requests

```
HTTP request
  → authenticate()         JWT verified; user loaded by { _id, organizationId }
  → req.auth               { userId, organizationId, role } from the user row
  → tenantContext()        organization TRIAL|ACTIVE
  → authorize(permission)  see authorization.md
  → repository             tenantFilter(auth.organizationId, …)
  → MongoDB
```

### Platform requests

```
HTTP request
  → authenticate()              PLATFORM_ADMIN JWT (no organizationId claim)
  → requirePlatformAdmin()
  → platform service            target organizationId from URL path only
  → audit_logs write
  → MongoDB
```

Platform routes live under `/api/v1/platform/*`. Public exception: `POST /api/v1/platform/invitations/:token/accept`.

### How tenant context is obtained

From the authenticated user after AUTH-001. Not from:

- `X-Organization-Id` (ignored)
- `organizationId` in JSON body or query string
- Flutter environment variables

Writes use `withTenant(input, auth.organizationId)`, which discards any client `organizationId`.

Owner-created initial Admin, invite/accept for later users, and login establish the tenant, then issue a token that already contains it. Login also refuses users whose organization is missing or not operational.

### How it is validated

1. JWT signature and expiry
2. User exists with `{ _id: sub, organizationId: claim }` (tenant) or platform user without org, `status === ACTIVE`
3. `req.auth.organizationId` is taken from that user row (claim mismatch → 401)
4. Organization exists and status is `TRIAL` or `ACTIVE`

Failures: 401 (bad/missing token or disabled/mismatched user) or 403 (org missing or not operational).

## Which collections require `organizationId`

Required: `users` (except `PLATFORM_ADMIN`), `refresh_tokens` (null for platform sessions), `campuses`, `classrooms`, `students`, `student_guardians`, `attendance`, `student_events`, `media`, `notifications`, `device_tokens`, `notification_preferences`, `buses`, `bus_routes`, `bus_stops`, `route_segments`, `student_transport_assignments`, `daily_transport_plans`, `route_progress`, `user_invitations`, and later `activities` (ACTIVITY-001).

Not required: `organizations` (the tenant row), `audit_logs` (may reference an org), platform-only users.

## How repositories enforce isolation

`apps/api/src/data/tenant.ts`:

```ts
findById(organizationId, id)
// filter: tenantFilter(organizationId, { _id: id })
```

Never `{ _id: id }` alone for tenant-owned rows.

List methods start from `{ organizationId }` (and `deletedAt: null` when that field exists) and then add role scope (`classroomId: { $in: assignedIds }`, etc.).

`PLATFORM_ADMIN` does **not** get an org-wide bypass inside tenant repositories. Platform services load a target org by path id and then call repositories with that explicit id when needed (usage counts, invitations). They must not read student PII unless a later ticket requires audited support access.

## How cross-tenant access is prevented

| Control | Rule |
| --- | --- |
| Token | Tenant `organizationId` is a signed claim; user lookup includes it |
| Platform token | No `organizationId` claim; cannot call tenant APIs (`authorize` fails closed) |
| Writes | Inserts set `organizationId` from `auth` via `withTenant` |
| Reads | Filter includes `organizationId` |
| Unknown id | Return **404** even if the id exists in another org |
| Query / body / header | Client `organizationId` and `X-Organization-Id` are not used for scoping |
| QR | Lookup `{ organizationId, qrToken }`. Other-org token → 404 |
| Indexes | Tenant collections: compound indexes that start with `organizationId` |

Proof: org A cannot GET/PATCH org B campuses or students (404). Tenant ADMIN cannot hit `/platform/*` (403).

## Scope inside a tenant

Tenant isolation is necessary but not sufficient. After the org filter, [authorization.md](./authorization.md) applies role scope. Empty assignment lists mean **no access**. Only `ADMIN` sees the whole organization. Supervisor campus scope remains `users.campusIds` (no separate assignment collection in Slice 1).

## Subscription limits

`SubscriptionService` centralizes plan limits and feature flags (`canCreateCampus`, `canCreateStudent`, `canUseBusModule`, …). Controllers must not hardcode plan names.
