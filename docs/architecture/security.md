# Security Boundaries

The platform stores children's names, photos, attendance, and daily events. The API enforces every permission. The mobile app does not.

## Authentication

| Boundary | Rule |
| --- | --- |
| Who is a user | Staff and guardians. Students are not accounts in v1 |
| Proof | JWT access token + refresh token |
| Storage (mobile) | Secure storage only, never shared prefs / logs |
| Storage (API) | Password hash (bcryptjs). Refresh session row with `jti` / `revokedAt` |
| Transport | HTTPS in non-local environments |
| Claims | `sub`, `organizationId`, `role` — not a shopping list of student ids (those change) |

Public routes: health, login, token refresh, invite acceptance. Everything else requires a valid user.

## Authorization

Enforced in this order (see [authorization.md](./authorization.md)):

1. Authenticated (`authenticate`)
2. Correct tenant (`tenantContext` — see [multi-tenancy.md](./multi-tenancy.md))
3. Role allowed to call this endpoint (`authorize(permission)`)
4. Row is in the caller's scope (campus / classroom / route / linked children)

| Case | HTTP |
| --- | --- |
| No / invalid / expired token | 401 `UNAUTHORIZED` |
| Authenticated, missing permission | 403 `FORBIDDEN` |
| Wrong tenant or outside scope | 404 `NOT_FOUND` |

UI that hides a button is convenience. A forged Dio call must still get 403/404.

## Tenant isolation

Documented in [multi-tenancy.md](./multi-tenancy.md). Cross-org reads/writes are bugs, not edge cases.

## Parent → child

A `GUARDIAN` may only read students linked in `student_guardians` for their `userId`.

They may not:

- List a classroom
- Read another child's events or media
- Create attendance or journey events
- See staff-only `visibility` media

`canPickup` and `receivesNotifications` further restrict pickup and push, not the existence of the link.

## Teacher → classroom

A `TEACHER` may only act on `classroomIds` assigned on their user (and those classrooms' students).

They may not open another class by guessing its id. Unassigned teacher → empty roster, not org-wide.

## Driver → route

A `DRIVER` may only see students on assigned `routeIds`, and may only record boarding / departure / drop-off (and equivalent QR events) for those students.

They may not read full academic notes, arbitrary media, or other routes.

## Supervisor and admin

- `SUPERVISOR`: campuses in `campusIds` (operations, alerts, buses at that site)
- `ADMIN`: whole organization, including user administration

Neither role crosses `organizationId`.

## Media

- Bytes in private object storage; Mongo holds metadata and `studentId`
- Download path: API checks tenant + student scope, then issues a short-lived signed URL
- Student photos only in MEDIA-001. Class photos: each guardian only receives media for their child, unless a later ticket defines a class-feed permission
- Soft-delete media; do not leave public keys around
- QR codes are not media of identity documents and must not encode PII

## Audit

Minimum when write APIs exist:

| What | How |
| --- | --- |
| Who recorded an event | `student_events.recordedBy` + `occurredAt` |
| Who uploaded media | `media.uploadedBy` + `createdAt`. Upload/delete also log org, user, student, media id |
| Corrections | Event void fields; do not rewrite history silently |
| Authz failures | Log org, user, route, target id — not tokens or passwords |

A dedicated `audit_logs` collection is not required yet. Add it when admin user mutations need a trail.

## Sensitive data

| Data | Handling |
| --- | --- |
| Passwords | Hash only |
| Tokens | Secure storage / http-only not applicable (mobile). No log output |
| Student PII | Tenant + role scope on every query |
| Photos | Authorized signed URLs |
| QR | Random `qrToken`, rotatable if leaked |
| Date of birth | Staff/guardian scoped; never in QR or FCM body beyond what the parent already knows |

Do not put names, medical notes, or addresses in QR payloads or unauthenticated error messages.

## Threats this architecture rejects

- Trusting the client `organizationId` (body, query, or `X-Organization-Id`)
- Looking up tenant rows by `_id` without `organizationId`
- Treating 403 vs 404 as a way to discover other orgs (use 404)
- Driver or teacher "because the app only shows my list"
- Permanent public object-storage URLs

Automated checks: `apps/api/tests/tenant.test.ts`, `apps/api/tests/students.test.ts`, `apps/api/tests/attendance.test.ts`, `apps/api/tests/journey.test.ts`, and `apps/api/tests/media.test.ts`.
