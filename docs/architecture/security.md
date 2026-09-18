# Security Boundaries

The platform stores children's names, photos, attendance, and daily events. The API enforces every permission. The mobile app does not.

## Authentication

| Boundary         | Rule                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------- |
| Who is a user    | Staff and guardians. Students are not accounts in v1                                     |
| Proof            | JWT access token + refresh token                                                         |
| Storage (mobile) | Secure storage only, never shared prefs / logs                                           |
| Storage (API)    | Password hash (bcryptjs). Refresh session row with `jti` / `revokedAt`                   |
| Transport        | HTTPS in non-local environments                                                          |
| Claims           | Tenant: `sub`, `organizationId`, `role`. Platform: `sub`, `role=PLATFORM_ADMIN` (no org) |

Public routes: health, login, token refresh, invitation accept. Everything else requires a valid user.

### Platform owner bootstrap (PLATFORM-002)

The SaaS owner is a normal `users` row (`role=PLATFORM_ADMIN`, `organizationId=null`). Passwords live only as `passwordHash` in MongoDB.

Initial provisioning is a **one-time CLI**, not permanent env-based login:

```bash
PLATFORM_BOOTSTRAP_EMAIL=wael@rivo.com \
PLATFORM_BOOTSTRAP_PASSWORD=<from secret manager> \
npm run bootstrap:platform-admin
```

| Rule          | Detail                                                                                                                                  |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Idempotent    | If any `PLATFORM_ADMIN` exists → `"Platform admin already exists. No changes made."` — password is never overwritten                    |
| Secrets       | Bootstrap email/password from env or cloud secret manager only. Never Git, Docker images, seed files, Jira, or docs with real passwords |
| After success | Remove or rotate bootstrap secrets. Database is the permanent auth source of truth                                                      |
| Auth path     | Same `/api/v1/auth/login` as tenant users. Never compare credentials to `PLATFORM_BOOTSTRAP_*`                                          |
| Hashing       | Reuse AUTH-001 bcryptjs (`passwordHash`). No plaintext `password` field                                                                 |
| MFA           | `users.mfaEnabled` reserved; enforce in SECURITY-002                                                                                    |

Demo seed may still create `platform.admin@demo.local` for local demos. Production / first real owner: bootstrap `wael@rivo.com` only.

### Platform admin audit

| Action                            | When                                              |
| --------------------------------- | ------------------------------------------------- |
| `PLATFORM_ADMIN_CREATED`          | Bootstrap creates the account                     |
| `PLATFORM_ADMIN_LOGIN`            | Successful platform login                         |
| `PLATFORM_ADMIN_LOGIN_FAILED`     | Bad password or inactive platform admin           |
| `PLATFORM_ADMIN_DISABLED`         | Status set to `INACTIVE`                          |
| `PLATFORM_ADMIN_PASSWORD_CHANGED` | Password changed through the hashed-password path |

Never store passwords, hashes, JWTs, refresh tokens, or bootstrap secrets in audit metadata or application logs.

## Authorization

Enforced in this order (see [authorization.md](./authorization.md)):

1. Authenticated (`authenticate`)
2. Correct tenant (`tenantContext` — see [multi-tenancy.md](./multi-tenancy.md))
3. Role allowed to call this endpoint (`authorize(permission)`)
4. Row is in the caller's scope (campus / classroom / route / linked children)

| Case                              | HTTP               |
| --------------------------------- | ------------------ |
| No / invalid / expired token      | 401 `UNAUTHORIZED` |
| Authenticated, missing permission | 403 `FORBIDDEN`    |
| Wrong tenant or outside scope     | 404 `NOT_FOUND`    |

UI that hides a button is convenience. A forged Dio call must still get 403/404.

## Tenant isolation

Documented in [multi-tenancy.md](./multi-tenancy.md). Cross-org reads/writes are bugs, not edge cases.

## Parent → child

A `GUARDIAN` may only read students linked in `student_guardians` for their `userId`.

They may not:

- List a classroom
- Read another child's events or media
- Create attendance or journey events (except direction-specific bus cancellation, which writes `TRANSPORT_CANCELLED` via the parent transport API)
- See staff-only `visibility` media
- See other children's names at a shared stop (count only)

`canPickup` and `receivesNotifications` further restrict pickup and push, not the existence of the link.

## Teacher → classroom

A `TEACHER` may only act on `classroomIds` assigned on their user (and those classrooms' students).

They may not open another class by guessing its id. Unassigned teacher → empty roster, not org-wide.

## Driver → route

A `DRIVER` may only see students on assigned `routeIds`, and may only record boarding / departure / drop-off (and equivalent QR events) for those students. Route progress is recorded per physical stop; it is not GPS.

They may not read full academic notes, arbitrary media, or other routes.

## Supervisor and admin

- `SUPERVISOR`: campuses in `campusIds` (operations, alerts, buses at that site)
- `ADMIN`: whole organization, including user administration

Neither role crosses `organizationId`.

## Media

- Bytes in private object storage (Cloudinary `authenticated`, not public); Mongo holds metadata and `studentId`
- Download path: API checks tenant + student scope, then issues a short-lived signed URL
- Student photos only in MEDIA-001. Class photos: each guardian only receives media for their child, unless a later ticket defines a class-feed permission
- Soft-delete media; do not leave public keys around
- QR codes are not media of identity documents and must not encode PII

## Audit

| What                  | How                                                                                                                                                                                                       |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Who recorded an event | `student_events.recordedBy` + `occurredAt`                                                                                                                                                                |
| Who uploaded media    | `media.uploadedBy` + `createdAt`. Upload/delete also log org, user, student, media id                                                                                                                     |
| Corrections           | Event void fields; do not rewrite history silently                                                                                                                                                        |
| Authz failures        | Log org, user, route, target id — not tokens or passwords                                                                                                                                                 |
| Platform actions      | `audit_logs` — tenant create/update/lifecycle, owner-created initial Admin, subscription changes, additional admin invites/accepts, platform-admin bootstrap/login/disable/password-change. Never store passwords, JWTs, or raw invitation tokens |

## Sensitive data

| Data              | Handling                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------------------- |
| Passwords         | Hash only                                                                                                  |
| Tokens            | Secure storage / http-only not applicable (mobile). No log output                                          |
| Invitation tokens | SHA-256 hash in Mongo; raw token returned once to platform client                                          |
| Student PII       | Tenant + role scope on every query. Platform usage endpoints return counts only                            |
| Photos            | Authorized signed URLs                                                                                     |
| QR                | Random `qrToken`, rotatable if leaked                                                                      |
| Date of birth     | Staff/guardian scoped; never in QR or FCM body beyond what the parent already knows                        |
| Push payloads     | IDs only (`type`, `studentId`, `eventId` / `mediaId`). Recipients come from guardian links, not the client |

Do not put names, medical notes, or addresses in QR payloads or unauthenticated error messages. FCM notification title/body may include the child's first name because that parent already has the child.

## Threats this architecture rejects

- Trusting the client `organizationId` (body, query, or `X-Organization-Id`)
- Looking up tenant rows by `_id` without `organizationId`
- Treating 403 vs 404 as a way to discover other orgs (use 404)
- Driver or teacher "because the app only shows my list"
- Permanent public object-storage URLs
- Giving tenant `ADMIN` platform routes, or `PLATFORM_ADMIN` routine school operations
- Storing raw invitation tokens
- Authenticating the platform owner against `.env` / bootstrap secrets after provisioning
- A permanent master password or hidden auth bypass

Automated checks: `apps/api/tests/tenant.test.ts`, `apps/api/tests/students.test.ts`, `apps/api/tests/attendance.test.ts`, `apps/api/tests/journey.test.ts`, `apps/api/tests/media.test.ts`, `apps/api/tests/notifications.test.ts`, `apps/api/tests/platform.test.ts`, and `apps/api/tests/platform-admin-bootstrap.test.ts`.
