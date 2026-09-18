# Roles and Access

Who can see and do what in Digital Student. This is the working access guide for v1 + PLATFORM-001 Slice 1.

Same mobile app for every **school** person. The server decides access. The app only hides screens the role cannot use.

Canonical login roles:

`PLATFORM_ADMIN` · `ADMIN` · `SUPERVISOR` · `TEACHER` · `DRIVER` · `GUARDIAN`

Students do **not** log in.

A tenant user belongs to **one organization**. They cannot see another school’s data.

`PLATFORM_ADMIN` belongs to **no** organization. They operate the SaaS console APIs only.

Empty assignment lists mean **no access**, not “all campuses / all classes / all routes”. Only `ADMIN` is organization-wide inside a tenant.

Related: [user-roles.md](user-roles.md), [authorization.md](../architecture/authorization.md), [multi-tenancy.md](../architecture/multi-tenancy.md), [security.md](../architecture/security.md).

---

## 1. Scope of each role

| Role               | Sees                                                                     | Can do                                                                                                          | Cannot do                                                                                                   |
| ------------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **PLATFORM_ADMIN** | All organizations (metadata, subscription, usage counts)                 | Provision tenants, lifecycle, invite first ADMIN, change plan fields, read platform audit                       | Daily school ops (attendance, journeys, buses, student PII) unless a later audited support ticket allows it |
| **ADMIN**          | Whole organization: every campus, classroom, student, bus, guardian link | Manage org profile, campuses, classrooms, students, guardians, attendance, journey events, buses/routes, photos | Other organizations. Platform APIs. Creating `PLATFORM_ADMIN`                                               |
| **SUPERVISOR**     | Campuses in `campusIds` on their user                                    | Daily operations on those campuses                                                                              | Campuses they are not assigned to. Empty `campusIds` = no campuses. Platform APIs                           |
| **TEACHER**        | Classrooms in `classroomIds`                                             | Roster, attendance, class journey events, photos for those classes                                              | Other classes. Cannot create students, campuses, or buses                                                   |
| **DRIVER**         | Students on assigned `routeIds`                                          | Boarding QR, route progress, drop-off, missed bus                                                               | Other routes, classroom roster, photos, attendance roll                                                     |
| **GUARDIAN**       | Linked children only                                                     | Read journey, attendance, photos, notifications. Cancel that child’s bus for a date/direction                   | Classroom lists, other children, recording attendance/events (except bus cancel)                            |
| **Student**        | —                                                                        | —                                                                                                               | Not an account in v1                                                                                        |

---

## 2. Platform Admin — tenant provisioning

Platform Admin uses `/api/v1/platform/*`. Flutter console is PLATFORM-004 (`features/platform`).

### Create tenant

Required: name, country, contact email, plan (`STARTER` / `PROFESSIONAL` / `ENTERPRISE`), and nested `initialAdmin` (`firstName`, `lastName`, `email`, `password`).

Optional: timezone, language, phone, address, website, notes, logo.

Server generates `organizationId`, `slug`, timestamps. Client cannot set `organizationId`.

Default status: `TRIAL`. Lifecycle actions: activate → `ACTIVE`, suspend → `SUSPENDED`, deactivate → `INACTIVE`.

### Owner-created Initial Admin

```
PLATFORM_ADMIN → create tenant + initial Admin (hashed password)
  → Admin ACTIVE immediately → Admin logs in → may change password
```

No invitation token for the first Admin. Additional admins may still use `POST /organizations/:id/admin-invitation` and public accept.

Invited/created role is always tenant `ADMIN` with the new `organizationId`. Never `PLATFORM_ADMIN`.

### Seed platform operator (local demos only)

`platform.admin@demo.local` / shared demo seed password (see seed README). **Not** for production.

### Production / first real owner (PLATFORM-002)

```bash
PLATFORM_BOOTSTRAP_EMAIL=wael@rivo.com \
PLATFORM_BOOTSTRAP_PASSWORD=<secret from secret manager> \
npm run bootstrap:platform-admin
```

Creates `PLATFORM_ADMIN` with `organizationId=null`, status `ACTIVE`. Password is hashed; bootstrap is idempotent and never overwrites an existing platform admin. After success, rotate/remove bootstrap secrets. Login uses `/api/v1/auth/login` against MongoDB only.
---

## 3. ADMIN — see and do

Home in the app: campus list.

| Area          | See                                 | Do in the app today                                                        |
| ------------- | ----------------------------------- | -------------------------------------------------------------------------- |
| Organization  | Current org name/status/plan fields | `PATCH` org profile via API. No dedicated settings screen                  |
| Campuses      | All campuses                        | Create campus (subject to plan limits)                                     |
| Classrooms    | All classrooms                      | Create classroom                                                           |
| Students      | All students                        | Create / edit student, open journey, scan QR, record events, upload photos |
| Guardians     | Linked guardians                    | Add a parent/guardian to a student (creates a `GUARDIAN` login)            |
| Attendance    | Org attendance                      | Record present/absent, QR scan                                             |
| Buses         | All buses/routes at a campus        | Create buses/routes/stops, assign students, record progress                |
| Users         | All staff in org                    | Create/manage ADMIN, SUPERVISOR, TEACHER, DRIVER, GUARDIAN via `/users`. Role changes ADMIN-only. Cannot remove last active ADMIN. |
| Notifications | Own device/prefs if used            | Inbox UI is parent-focused today                                           |
| Platform      | —                                   | **Never**                                                                  |

API also allows admin to update/delete students and manage buses org-wide. Admin **cannot** cross into another tenant or call platform routes.

---

## 4. SUPERVISOR — see and do

Home in the app: campus list (only assigned campuses). Scope is `users.campusIds` (no separate assignment collection in Slice 1).

| Area         | See                                            | Do in the app today                                                                            |
| ------------ | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Organization | Read org profile                               | Cannot rename/disable the org                                                                  |
| Campuses     | Assigned campuses                              | Create campus (API allows `campuses.manage`; still only usable if assigned; plan limits apply) |
| Classrooms   | Classes on assigned campuses                   | Create classroom                                                                               |
| Students     | Students on assigned campuses                  | Create student, journey, QR, photos                                                            |
| Guardians    | Links for those students                       | Add guardian to a student                                                                      |
| Attendance   | Campus attendance                              | Record attendance / QR                                                                         |
| Buses        | Buses at that campus                           | Manage routes, boarding, arrivals                                                              |
| Users        | Staff in org                                   | Create/manage TEACHER, DRIVER, GUARDIAN only. Cannot create/manage ADMIN or SUPERVISOR. Campus writes require assigned `campusIds`. |

---

## 5. Selling the app / registering a new tenant

The paying customer is an **organization** (school / nursery). Campuses are branches inside that org.

| Who                             | Can register a new organization?            |
| ------------------------------- | ------------------------------------------- |
| School ADMIN                    | No                                          |
| SUPERVISOR / others             | No                                          |
| Anyone in the mobile school app | No self-service signup                      |
| **PLATFORM_ADMIN**              | Yes — `POST /api/v1/platform/organizations` |
| Seed / DB                       | Yes for demos                               |

Onboarding flow:

1. Platform Admin creates organization with required initial Admin credentials.
2. Initial Admin logs in immediately and may change password.
3. Admin creates campuses, classrooms, students, guardians in the school app.
4. Additional staff may use invitation / staff APIs where available.

Do **not** give one admin two schools. v1 is one tenant user → one organization.

---

## 6. What is not in the current platform slice

- Invitation resend/revoke UI
- Separate `TenantPlan` / `TenantSubscription` collections (plan fields live on the organization)
- `SupervisorCampusAssignment` collection (keep `campusIds`)
- Self-service school signup
- Multi-org membership
- Student login

Flutter platform console (Dashboard, Organizations, Invitations, Account) is implemented in PLATFORM-004.

## 7. UI to add supervisor, teacher, or parent

| Person to add                         | UI in the app today                      | Who can use it    | API                                               |
| ------------------------------------- | ---------------------------------------- | ----------------- | ------------------------------------------------- |
| Parent / guardian                     | Yes — student details → **Add guardian** | ADMIN, SUPERVISOR | `POST /guardians`, `POST /students/:id/guardians` |
| Student                               | Yes — classroom roster **+**             | ADMIN, SUPERVISOR | `POST /students`                                  |
| Campus                                | Yes — campus list **+**                  | ADMIN, SUPERVISOR | `POST /campuses`                                  |
| Classroom                             | Yes — classroom list **+**               | ADMIN, SUPERVISOR | `POST /classrooms`                                |
| Teacher / Supervisor / Admin / Driver | Yes — app bar **Users** → Add user | ADMIN (all roles); SUPERVISOR (TEACHER/DRIVER/GUARDIAN) | `POST/PATCH /api/v1/users` |
| New organization / tenant             | Yes — Platform Console → Organizations → create | PLATFORM_ADMIN    | `/api/v1/platform/organizations`                  |
