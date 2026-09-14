# Authorization

RBAC and resource-scope checks sit after authentication. The API is the security boundary; Flutter only chooses which screens to show.

## Flow

```
HTTP request
  → authenticate()          JWT → req.auth { userId, organizationId, role }
  → tenantContext()         organization exists and status === ACTIVE
  → authorize(permission)   role → permission matrix
  → controller / service    resource-scope helpers
  → repository              tenantFilter(organizationId, …)
  → MongoDB
```

| Failure | Status | Code |
| --- | --- | --- |
| Missing / invalid / expired token, or user not found in that org | 401 | `UNAUTHORIZED` or `ACCESS_TOKEN_EXPIRED` |
| Authenticated but role lacks the permission, or org is missing/INACTIVE | 403 | `FORBIDDEN` |
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

`tenantContext` then loads `organizations` by `auth.organizationId`. No org, or `INACTIVE`, → 403.

v1: one user, one organization. Multi-org memberships need a later `memberships` design.

## Roles

Canonical values (same as AUTH-001):

`ADMIN` · `SUPERVISOR` · `TEACHER` · `DRIVER` · `GUARDIAN`

Stored as a single `users.role`. Do not branch on string literals in controllers. Call `authorize('students.read')` (or `hasPermission`) instead.

## Permissions

Defined in `apps/api/src/authorization/permissions.ts`. Add a permission when the matching feature ticket lands; the names below are the v1 vocabulary.

| Permission | Meaning |
| --- | --- |
| `organizations.read` | Read current org profile |
| `organizations.update` | Update current org profile |
| `users.read` / `users.create` / `users.update` | Staff user administration |
| `campuses.read` / `campuses.manage` | Campuses |
| `classrooms.read` / `classrooms.manage` | Classrooms |
| `students.read` / `create` / `update` / `delete` | Student records |
| `guardians.read` / `guardians.manage` | Guardian users and student links |
| `attendance.read` / `attendance.create` | Daily attendance |
| `student_events.read` / `student_events.create` | Journey events |
| `buses.read` / `buses.manage` | Buses and routes |
| `media.read` / `media.create` / `media.delete` | Photos / files |

TENANT-001 enforces `organizations.read` and `organizations.update` on `GET/PATCH /api/v1/organizations/current`. STUDENT-001 uses `campuses.*`, `classrooms.*`, `students.*`, and `guardians.*`. ATTENDANCE-001 uses `attendance.read` and `attendance.create`. JOURNEY-001 uses `student_events.read` and `student_events.create`. MEDIA-001 uses `media.read`, `media.create`, and `media.delete`.

## Role × permission matrix

| Capability | Admin | Supervisor | Teacher | Driver | Guardian |
| --- | --- | --- | --- | --- | --- |
| Organization management (`organizations.update`) | yes | no | no | no | no |
| Read organization (`organizations.read`) | yes | yes | yes | yes | yes |
| User management | yes | yes (limited later by campus) | no | no | no |
| View students | yes | yes | assigned class | assigned route | own children |
| Create / update / delete students | yes | yes | no | no | no |
| Manage classrooms | yes | yes | assigned (read) | no | no |
| Record attendance | yes | yes | yes | no | no |
| Record student events | yes | yes | yes | assigned route types | no |
| View own children | n/a | n/a | n/a | n/a | yes |
| Manage buses / routes | yes | yes | no | assigned route (read) | no |
| Media create | yes | yes | yes | no | no |
| Media delete | yes | yes | no | no | no |

“Assigned” and “own children” are **resource-level** rules, not extra permissions. A teacher with `students.read` still must fail closed on another class’s student.

Empty assignment lists mean **no rows**, not the whole organization. Only `ADMIN` is org-wide inside the tenant.

## Resource-level authorization

`apps/api/src/authorization/scope.ts` is the resource-scope hook after RBAC:

| Helper | Rule |
| --- | --- |
| `assertSameTenant` | `String(document.organizationId)` must equal `auth.organizationId` |
| `assertAssigned(auth, resourceId, assignedIds)` | `ADMIN` is org-wide. Every other role must include the id. Empty `assignedIds` means **no access**. |

STUDENT-001 computes `assignedIds` from the role (guardian → `student_guardians`, teacher → `users.classroomIds`, supervisor → `users.campusIds`). Drivers have no education-domain assignment until BUS-001 (`routeIds`); their student lists are empty. Do not call a role-specific helper that returns early for other roles — that fails open.

## MongoDB tenant filtering

Reusable helpers in `apps/api/src/data/tenant.ts`:

```ts
tenantFilter(organizationId, { _id: id })
// → { organizationId, _id: id }

withTenant(body, auth.organizationId)
// strips client organizationId, stamps auth's org
```

Every tenant repository method takes `organizationId` as a required argument. Lookups are `findOne({ _id, organizationId })`, never `{ _id }` alone.

`users`: `{ organizationId: 1, role: 1 }` plus unique `{ email: 1 }`. Teacher/supervisor assignment lives on `classroomIds` / `campusIds`.

## Flutter

Session already includes `id`, `organizationId`, and `role` from `/auth/login` and `/auth/me`. Use `role` only for navigation. Repeat every check on the server.

## Testing

See `apps/api/tests/tenant.test.ts`, `apps/api/tests/authorization.test.ts`, `apps/api/tests/students.test.ts`, `apps/api/tests/attendance.test.ts`, `apps/api/tests/journey.test.ts`, and `apps/api/tests/media.test.ts`. Minimum coverage:

- unauthenticated / invalid / expired → 401
- teacher `PATCH /organizations/current` → 403; admin → 200
- org A cannot GET/PATCH org B campuses or students (404)
- `?organizationId=`, body `organizationId`, and `X-Organization-Id` cannot switch tenant
- JWT `organizationId` that does not match the user row → 401
- guardian helper allows linked child ids only; teacher sees assigned classrooms only
