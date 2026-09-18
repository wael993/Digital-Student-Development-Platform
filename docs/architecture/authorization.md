# Authorization

RBAC and resource-scope checks sit after authentication. The API is the security boundary; Flutter only chooses which screens to show.

## Flow

### Tenant

```
HTTP request
  → authenticate()          JWT → req.auth { userId, organizationId, role }
  → tenantContext()         organization exists and status ∈ { TRIAL, ACTIVE }
  → authorize(permission)   role → permission matrix
  → controller / service    resource-scope helpers
  → repository              tenantFilter(organizationId, …)
  → MongoDB
```

### Platform

```
HTTP request
  → authenticate()              PLATFORM_ADMIN (no org claim)
  → requirePlatformAdmin()
  → platform controller/service
  → audit write
  → MongoDB
```

| Failure | Status | Code |
| --- | --- | --- |
| Missing / invalid / expired token, or user not found in that org | 401 | `UNAUTHORIZED` or `ACCESS_TOKEN_EXPIRED` |
| Authenticated but role lacks the permission | 403 | `FORBIDDEN` |
| Org suspended / inactive / cancelled | 403 | `TENANT_SUSPENDED` / `TENANT_INACTIVE` / `TENANT_CANCELLED` |
| Plan limit exceeded | 403 | `PLAN_LIMIT` |
| Resource not in this tenant or not in the caller's scope | 404 | `NOT_FOUND` |

401 is never used for “wrong role”. 403 is never used for “no token”. Cross-tenant ids look like missing rows (404), not a permission error.

Generic 403 body:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to perform this action"
  }
}
```

Do not put the missing permission name or the other org’s id in the message.

## Tenant context

`req.auth` is copied from the **user row** after JWT verification (`authenticate`), not from the request body, query, or `X-Organization-Id`.

`tenantContext` then loads `organizations` by `auth.organizationId`. No org, or status not operational → 403 with a specific tenant code when applicable.

`PLATFORM_ADMIN` skips tenant org loading. Tenant routes still fail `authorize(...)` because platform has an empty permission set.

v1: one tenant user, one organization. Multi-org memberships need a later `memberships` design.

## Roles

Canonical tenant values:

`ADMIN` · `SUPERVISOR` · `TEACHER` · `DRIVER` · `GUARDIAN`

Platform:

`PLATFORM_ADMIN`

Stored as a single `users.role`. Platform users must not have an `organizationId`. Tenant users must not be `PLATFORM_ADMIN`.

Do **not** branch on string literals in controllers. Call `authorize('students.read')` (or `hasPermission`) for tenant routes, and `requirePlatformAdmin()` for platform routes.

### Staff hierarchy (AUTH-002)

| Actor | May create / manage |
| --- | --- |
| `ADMIN` | `ADMIN`, `SUPERVISOR`, `TEACHER`, `DRIVER`, `GUARDIAN` |
| `SUPERVISOR` | `TEACHER`, `DRIVER`, `GUARDIAN` only |
| Others | none |

Only `ADMIN` may change a user's `role`. Users cannot change their own role or assignment scope via `/users`. Disabling or demoting the last active `ADMIN` returns `403 LAST_ACTIVE_ADMIN`.

## Permissions

Defined in `apps/api/src/authorization/permissions.ts`. Add a permission when the matching feature ticket lands; the names below are the v1 vocabulary.

| Permission | Meaning |
| --- | --- |
| `organizations.read` | Read current org profile |
| `organizations.update` | Update current org profile |
| `users.read` / `users.create` / `users.update` | Staff user administration. Hierarchy enforced in `user.service` (SUPERVISOR → TEACHER/DRIVER/GUARDIAN only; only ADMIN changes roles; `LAST_ACTIVE_ADMIN` on disable/demote). |
| `campuses.read` / `campuses.manage` | Campuses |
| `classrooms.read` / `classrooms.manage` | Classrooms |
| `students.read` / `create` / `update` / `delete` | Student records |
| `guardians.read` / `guardians.manage` | Guardian users and student links |
| `attendance.read` / `attendance.create` | Daily attendance |
| `student_events.read` / `student_events.create` | Journey events |
| `buses.read` / `buses.manage` | Buses and routes |
| `media.read` / `media.create` / `media.delete` | Photos / files |
| `notifications.read` / `notifications.update` | Own inbox, preferences, and device tokens |

`PLATFORM_ADMIN` has **no** tenant permissions. Platform capabilities are enforced only via `requirePlatformAdmin()` on `/api/v1/platform/*`.

## Role × permission matrix (tenant)

| Capability | Admin | Supervisor | Teacher | Driver | Guardian |
| --- | --- | --- | --- | --- | --- |
| Organization management (`organizations.update`) | yes | no | no | no | no |
| Read organization (`organizations.read`) | yes | yes | yes | yes | yes |
| User management | yes (all tenant roles; last active ADMIN protected) | yes (TEACHER / DRIVER / GUARDIAN only) | no | no | no |
| View students | yes | yes | assigned class | assigned route | own children |
| Create / update / delete students | yes | yes | no | no | no |
| Manage classrooms | yes | yes | assigned (read) | no | no |
| Record attendance | yes | yes | yes | no | no |
| Record student events | yes | yes | yes | assigned route types | no |
| View own children | n/a | n/a | n/a | n/a | yes |
| Manage buses / routes | yes | yes | classroom arrivals / pickups | assigned route (read + progress) | own child plan / cancel / ETA |
| Media create | yes | yes | yes | no | no |
| Media delete | yes | yes | no | no | no |
| Platform APIs | no | no | no | no | no |

## Platform Admin matrix (summary)

| Action | PLATFORM_ADMIN | Tenant ADMIN |
| --- | --- | --- |
| Create / list / edit tenants | yes | no (own profile only via `/organizations/current`) |
| Activate / suspend / deactivate | yes | no |
| Manage subscription fields | yes | view own later (Slice 2 UI) |
| Create owner initial ADMIN | yes | — |
| Invite additional ADMIN | yes | — |
| Create PLATFORM_ADMIN | `npm run bootstrap:platform-admin` (one-time; idempotent) | no |
| Daily school operations | no | yes |

Platform capabilities (enforced by `requirePlatformAdmin()` on `/api/v1/platform/*`, not tenant `PERMISSIONS`):

- organizations: read / create / update / activate / suspend / deactivate
- subscriptions: read / manage
- usage: read
- invitations: create (additional tenant ADMIN after owner-created initial Admin)
- audit: read

Do **not** grant `PLATFORM_ADMIN` tenant school-ops permissions (`students.write`, `attendance.write`, `journey.write`, `media.write`, `bus_operations.write`).

## Resource-level authorization

`apps/api/src/authorization/scope.ts` is the resource-scope hook after RBAC:

| Helper | Rule |
| --- | --- |
| `assertSameTenant` | `String(document.organizationId)` must equal `auth.organizationId` |
| `assertAssigned(auth, resourceId, assignedIds)` | `ADMIN` is org-wide. Every other role must include the id. Empty `assignedIds` means **no access**. |

STUDENT-001 computes `assignedIds` from the role (guardian → `student_guardians`, teacher → `users.classroomIds`, supervisor → `users.campusIds`). BUS-001 adds driver `users.routeIds` (synced from `buses.driverId`). Do not call a role-specific helper that returns early for other roles — that fails open.

## MongoDB tenant filtering

Reusable helpers in `apps/api/src/data/tenant.ts`:

```ts
tenantFilter(organizationId, { _id: id })
// → { organizationId, _id: id }

withTenant(body, auth.organizationId)
// strips client organizationId, stamps auth's org
```

Every tenant repository method takes `organizationId` as a required argument. Lookups are `findOne({ _id, organizationId })`, never `{ _id }` alone.

`users`: `{ organizationId: 1, role: 1 }` plus unique `{ email: 1 }`. Teacher/supervisor/driver assignment lives on `classroomIds` / `campusIds` / `routeIds`.

## JWT claims

Tenant:

```json
{ "sub": "userId", "organizationId": "orgId", "role": "ADMIN", "type": "access" }
```

Platform:

```json
{ "sub": "platformUserId", "role": "PLATFORM_ADMIN", "type": "access" }
```

## Flutter

Session already includes `id`, `organizationId`, and `role` from `/auth/login` and `/auth/me`. Use `role` only for navigation. Repeat every check on the server. Platform console UI is Slice 2.

## Testing

See `apps/api/tests/platform.test.ts`, `tests/tenant.test.ts`, `tests/authorization.test.ts`, and feature tests. Minimum coverage:

- unauthenticated / invalid / expired → 401
- teacher `PATCH /organizations/current` → 403; admin → 200
- org A cannot GET/PATCH org B campuses or students (404)
- `?organizationId=`, body `organizationId`, and `X-Organization-Id` cannot switch tenant
- JWT `organizationId` that does not match the user row → 401
- tenant ADMIN cannot access `/platform/*`
- PLATFORM_ADMIN cannot access tenant operational routes
- suspended tenant cannot login or call tenant APIs
- invitation single-use + expiry
- subscription campus/student limits via `SubscriptionService`
- platform bootstrap idempotency + no env-based login (`platform-admin-bootstrap.test.ts`)
