# Domain Model & MongoDB Strategy

ARCH-001 source of truth for entities, relationships, and the collection plan.

AUTH-001 implemented `users` and `refresh_tokens`. TENANT-001 implemented `organizations`. STUDENT-001 implemented `campuses`, `classrooms`, `students`, and `student_guardians`. ATTENDANCE-001 implemented `attendance`. JOURNEY-001 implemented `student_events`. MEDIA-001 implemented `media`. NOTIF-001 implemented `notifications`, `device_tokens`, and `notification_preferences`. Do not create the remaining collections until their tickets.

## Design decisions

| Decision | Choice | Ceiling / later upgrade |
| --- | --- | --- |
| Tenant root | `Organization` | — |
| Physical location | Every org has at least one `Campus`. Single-site nurseries still store one campus. Status `ACTIVE` \| `INACTIVE` (no hard delete). | Multi-campus already modeled |
| Class membership | A student has one primary `classroomId` | `enrollments` collection if a student joins multiple classes |
| Classroom stage | `level` enum: `NURSERY`, `KINDERGARTEN`, `PRIMARY`, `MIDDLE_SCHOOL`, `HIGH_SCHOOL` | Add values when a new stage is needed |
| Guardian identity | A guardian is a `User` with role `GUARDIAN`. No separate `guardians` collection. Links live in `student_guardians`. | — |
| Student–guardian link | `student_guardians` (many-to-many) | — |
| Student accounts | Students are **not** authenticated users in v1 | Student login if a later stage needs it |
| User tenancy | A user belongs to **one** `organizationId` | `memberships` if a parent has children at two orgs |
| Roles | AUTH-001 stores a single `role`. | `roles[]` if TENANT-001 needs teacher+guardian on one account |
| User name | `firstName` + `lastName` | — |
| User status | `ACTIVE` \| `INACTIVE` | Invites / suspend in a later ticket |
| Daily status | Derived from `student_events`. Optional denormalized cache on `students` | Cache is never the source of truth |
| Events | Append-only. Correct later with an explicit workflow, do not delete | — |
| Attendance | Separate daily roll-up in `attendance`, not a flag on the student | QR scan writes PRESENT for the org-local date and inserts `ATTENDANCE_PRESENT` |
| QR payload | Rotatable `qrToken` on the student. Random 32-char hex identifier only, never PII. QR scanning is ATTENDANCE-001. | Rotate token without changing `_id` |

## Relationship overview

```
Organization
├── Campuses
│   └── Classrooms
│       └── Students (primary classroom)
├── Users
│   ├── ADMIN
│   ├── SUPERVISOR  (scoped by campusIds)
│   ├── TEACHER     (scoped by classroomIds)
│   ├── DRIVER      (scoped by routeIds)
│   └── GUARDIAN    (scoped by student_guardians)
├── Buses
│   └── Routes (ordered stops / students)
├── Activities
├── Media
└── Notifications

Student
├── organizationId, campusId, classroomId
├── Guardians  ← student_guardians → Users (GUARDIAN)
├── StudentEvents (timeline)
├── Attendance (one row per student per day)
├── Media
└── Transportation (route stop assignment)
```

```mermaid
flowchart TB
  Org[Organization]
  Campus[Campus]
  Class[Classroom]
  User[User]
  Student[Student]
  Link[student_guardians]
  Event[StudentEvent]
  Att[Attendance]
  Bus[Bus]
  Route[Route]
  Act[Activity]
  Media[Media]
  Notif[Notification]

  Org --> Campus
  Campus --> Class
  Org --> User
  Org --> Student
  Class --> Student
  Student --> Link
  User --> Link
  Student --> Event
  Student --> Att
  Org --> Bus
  Bus --> Route
  Route --> Student
  Class --> Act
  Student --> Media
  Act --> Media
  Event --> Media
  Org --> Notif
  User --> Notif
```

## Core entities

Shared on every tenant-owned document unless noted:

- `organizationId` (ObjectId, required)
- `createdAt`, `updatedAt`
- `deletedAt` (Date, optional) — only where soft-delete is specified

MongoDB `_id` is the internal identifier. Do not put `_id` in QR codes.

### Organization

School / company / tenant. Also the SaaS customer row (PLATFORM-001).

| Field | Type | Notes |
| --- | --- | --- |
| name | string | |
| slug | string | Unique, server-generated |
| type | enum | Planned (`NURSERY`, `KINDERGARTEN`, `PRIMARY`, `MIDDLE`, `HIGH`, `MIXED`). Not stored yet. |
| status | enum | `TRIAL`, `ACTIVE`, `SUSPENDED`, `INACTIVE`, `CANCELLED` |
| country | string | |
| timezone | string | IANA timezone. Default `UTC`. ATTENDANCE-001 uses this for “today”. |
| defaultLanguage | string | Default `ar` |
| contactEmail | string | |
| contactPhone | string? | |
| planCode | enum | `STARTER`, `PROFESSIONAL`, `ENTERPRISE` |
| subscriptionStatus | enum | Separate from org status |
| subscriptionStartedAt / EndsAt / trialEndsAt | Date? | |
| address / website / notes / logoUrl | string? | Optional |
| retentionEndsAt | Date? | Set on cancel; permanent deletion is explicit later |

Not tenant-scoped (it **is** the tenant). No `organizationId` on this document.

### Campus

Physical site of an organization.

| Field | Type | Notes |
| --- | --- | --- |
| organizationId | ObjectId | |
| name | string | |
| address | string? | |
| status | enum | `ACTIVE`, `INACTIVE` |

### Classroom

Class / group inside a campus.

| Field | Type | Notes |
| --- | --- | --- |
| organizationId | ObjectId | |
| campusId | ObjectId | |
| name | string | |
| level | enum | `NURSERY`, `KINDERGARTEN`, `PRIMARY`, `MIDDLE_SCHOOL`, `HIGH_SCHOOL` |
| teacherIds | ObjectId[] | Users with TEACHER (denormalized; `users.classroomIds` is the authz source) |
| status | enum | `ACTIVE`, `INACTIVE` |

### User

Authenticated person. Students are not users.

| Field | Type | Notes |
| --- | --- | --- |
| organizationId | ObjectId? | Required for tenant roles; **null** for `PLATFORM_ADMIN` |
| email | string | Unique globally in v1 |
| passwordHash | string | Never returned by the API |
| firstName | string | |
| lastName | string | |
| role | enum | `PLATFORM_ADMIN`, `ADMIN`, `SUPERVISOR`, `TEACHER`, `DRIVER`, `GUARDIAN` |
| status | enum | `ACTIVE`, `INACTIVE` |
| mfaEnabled | boolean | Default `false`. MFA/passkeys: SECURITY-002 |
| lastLoginAt | Date? | Updated on successful login |
| campusIds | ObjectId[] | SUPERVISOR assignment; empty = no campuses |
| classroomIds | ObjectId[] | TEACHER assignment; empty = no classes |
| routeIds | ObjectId[] | DRIVER assignment; synced from `buses.driverId`. Empty = no routes |

Assignment scope: `campusIds` (supervisor), `classroomIds` (teacher), and `routeIds` (driver) are stored on the user. Guardian child access is **not** stored on the user. It lives in `student_guardians`. Empty assignment lists mean no rows. SCHOOL-001 strengthens this assignment model so permissions scale beyond a single nursery.

### UserInvitation (PLATFORM-001)

| Field | Type | Notes |
| --- | --- | --- |
| organizationId | ObjectId | Target tenant |
| email | string | |
| role | enum | Tenant role; Slice 1 invites `ADMIN` only |
| firstName / lastName | string | |
| tokenHash | string | SHA-256 of raw token; raw never stored |
| expiresAt | Date | |
| invitedBy | ObjectId | Platform or staff user |
| acceptedAt | Date? | |
| status | enum | `PENDING`, `ACCEPTED`, `EXPIRED`, `REVOKED` |

### AuditLog (PLATFORM-001)

Platform (and later tenant) mutation trail. Never store secrets in `metadata`.

| Field | Type | Notes |
| --- | --- | --- |
| actorUserId / actorRole | | |
| organizationId | ObjectId? | Target tenant when applicable |
| action | enum | e.g. `TENANT_CREATED`, `ADMIN_INVITED`, `PLATFORM_ADMIN_LOGIN` |
| resourceType / resourceId | | |
| metadata / ipAddress / userAgent | | |

### Student

Enrolled child. Must belong to an organization. Campus and classroom are required in v1.

| Field | Type | Notes |
| --- | --- | --- |
| organizationId | ObjectId | |
| campusId | ObjectId | |
| classroomId | ObjectId | Primary class |
| firstName | string | |
| lastName | string | |
| dateOfBirth | Date | |
| gender | enum | `MALE`, `FEMALE`, `OTHER` |
| studentNumber | string | Unique per organization |
| qrToken | string | Random, unique per org, rotatable. Never contains PII. |
| status | enum | `ACTIVE`, `INACTIVE`, `TRANSFERRED`, `GRADUATED` |
| currentStatus | string? | Denormalized latest event type. Cache only. Not written in JOURNEY-001. |
| currentStatusAt | Date? | Cache only |

No hard delete. Historical attendance/journey tickets will keep referencing these rows. Allergies, medication, emergency contacts, and authorized pickup people wait for PROFILE-001.

### student_guardians

Join between a student and a guardian user.

| Field | Type | Notes |
| --- | --- | --- |
| organizationId | ObjectId | |
| studentId | ObjectId | |
| userId | ObjectId | User with `GUARDIAN` |
| relationship | enum | `MOTHER`, `FATHER`, `LEGAL_GUARDIAN`, `OTHER` |
| isPrimary | boolean | |
| canPickup | boolean | Authorized to collect the child |
| receivesNotifications | boolean | |

A student may have many guardians. A guardian may have many students. Both directions are required.

### StudentEvent

One fact in the student's daily journey. Source of truth for timeline, latest status, history, notifications, reports, analytics, and later AI context.

See [student-journey.md](../product/student-journey.md) for event types and the mandatory vs metadata split.

| Field | Type | Notes |
| --- | --- | --- |
| organizationId | ObjectId | |
| studentId | ObjectId | |
| eventType | enum | Closed list; see journey doc |
| occurredAt | Date | Event time (not insert time) |
| recordedAt | Date | When the system stored it |
| recordedBy | ObjectId | Acting user |
| source | enum | `MANUAL`, `QR`, `SYSTEM`, `MANUAL_BULK` |
| metadata | object | Type-specific payload |

No `deletedAt`. No client updates after insert. A later ticket can add an explicit correction workflow.

### Attendance

School-day roll-up for reporting. Complements events; does not replace them. Implemented in ATTENDANCE-001.

| Field | Type | Notes |
| --- | --- | --- |
| organizationId | ObjectId | |
| studentId | ObjectId | |
| campusId | ObjectId | Copied from the student at scan time |
| classroomId | ObjectId | Copied from the student at scan time |
| date | string | `YYYY-MM-DD` in the organization timezone |
| attendanceType | enum | `PRESENT`, `ABSENT` (QR scan writes `PRESENT`) |
| scannedAt | Date | UTC. Set by the server, never the client |
| scannedBy | ObjectId | Authenticated user |
| source | enum | `QR`, `MANUAL`, `MANUAL_BULK` |

Unique: one document per student per org date. Repeat QR scans for that date return `ALREADY_RECORDED`. Successful PRESENT also inserts `ATTENDANCE_PRESENT` on `student_events`.

### Bus

Vehicle assigned to a campus. Driver/supervisor on the bus may change.

| Field | Type | Notes |
| --- | --- | --- |
| organizationId | ObjectId | |
| campusId | ObjectId | |
| name | string | |
| registrationNumber | string | |
| capacity | number | |
| status | enum | `ACTIVE`, `INACTIVE`, `MAINTENANCE` |
| driverId | ObjectId? | Sets `users.routeIds` for that driver |
| supervisorId | ObjectId? | |

### BusRoute

One direction of travel. Morning and afternoon are independent rows.

| Field | Type | Notes |
| --- | --- | --- |
| organizationId | ObjectId | |
| campusId | ObjectId | Copied from the bus |
| busId | ObjectId | |
| name | string | |
| direction | enum | `HOME_TO_SCHOOL`, `SCHOOL_TO_HOME` |
| status | enum | `ACTIVE`, `INACTIVE` |
| estimatedStartTime | string? | |
| estimatedEndTime | string? | |

### BusStop

Ordered **physical** stop. Multiple children at the same building share one stop. `stopsRemaining` counts these rows, not children.

| Field | Type | Notes |
| --- | --- | --- |
| organizationId | ObjectId | |
| routeId | ObjectId | |
| sequence | number | 1-based order |
| name | string | |
| address | string? | |
| latitude / longitude | number? | Stored for later GPS; v1 ETA does not use them |

### RouteSegment

Travel time between two consecutive stops.

| Field | Type | Notes |
| --- | --- | --- |
| organizationId | ObjectId | |
| routeId | ObjectId | |
| fromStopId | ObjectId | |
| toStopId | ObjectId | |
| estimatedMinutes | number | Default 5 when a new stop is added |

### StudentTransportAssignment

Permanent, direction-specific membership. A child can be on a morning route and not on an afternoon route (or the reverse). Classroom membership is separate.

| Field | Type | Notes |
| --- | --- | --- |
| organizationId | ObjectId | |
| studentId | ObjectId | |
| routeId | ObjectId | |
| stopId | ObjectId | Shared building stop |
| direction | enum | `HOME_TO_SCHOOL`, `SCHOOL_TO_HOME` |
| active | boolean | |
| effectiveFrom / effectiveTo | Date? | |

### DailyTransportPlan

One-day override. Parent cancellation writes `PARENT_CAR` + `CANCELLED` here and does **not** delete the permanent assignment.

| Field | Type | Notes |
| --- | --- | --- |
| organizationId | ObjectId | |
| studentId | ObjectId | |
| date | string | `YYYY-MM-DD` org timezone |
| direction | enum | `HOME_TO_SCHOOL`, `SCHOOL_TO_HOME` |
| transportMethod | enum | `BUS`, `PARENT_CAR`, `PARENT_PICKUP`, `AUTHORIZED_PICKUP`, `OTHER` |
| routeId / stopId | ObjectId? | Copied from the assignment when present |
| status | enum | `SCHEDULED`, `CANCELLED` |
| reason | string? | |
| createdBy | ObjectId | |

### RouteProgress

Driver/supervisor records where the bus is. v1 has no live GPS. ETA = current stop (last `ARRIVED`/`DEPARTED`) + remaining segment minutes. Label this **Estimated arrival**, never live location. GPS is BUS-002.

| Field | Type | Notes |
| --- | --- | --- |
| organizationId | ObjectId | |
| routeId | ObjectId | |
| date | string | |
| stopId | ObjectId | |
| sequence | number | |
| status | enum | `APPROACHING`, `ARRIVED`, `DEPARTED` |
| occurredAt | Date | |
| recordedBy | ObjectId | |
| source | enum | `MANUAL`, `SYSTEM` |
| parentsNotified | boolean | Next-stop notify once per stop/date |

### Activity

Classroom or learning activity.

| Field | Type | Notes |
| --- | --- | --- |
| organizationId | ObjectId | |
| campusId | ObjectId | |
| classroomId | ObjectId? | Null = campus-wide |
| name | string | |
| description | string? | |
| scheduledAt | Date? | |
| createdBy | ObjectId | |

### Media

Metadata only. Bytes live in private object storage (Cloudinary authenticated assets in dev/prod, local disk when Cloudinary env is unset). MEDIA-001 stores **student-specific photos**. Class/activity galleries wait for a later ticket.

| Field | Type | Notes |
| --- | --- | --- |
| organizationId | ObjectId | From auth, never from the client |
| studentId | ObjectId | Subject of this photo |
| uploadedBy | ObjectId | Acting staff user |
| mediaType | enum | `PHOTO` in v1. No video. |
| storageKey | string | `organizations/{orgId}/students/{studentId}/photos/{randomId}/original.jpg` |
| thumbnailStorageKey | string | Same prefix, `thumbnail.jpg` |
| contentType | string | Stored as `image/jpeg` after processing |
| size | number | Bytes of the stored original |
| width / height | number | Display version |
| capturedAt | Date | Client clock, validated |
| deletedAt | Date? | Soft-delete. Storage objects are removed. |

Never serve a permanent public URL. After tenant + student authorization, the API returns a short-lived signed URL. Do not persist signed URLs. Do not expose `storageKey` to clients.

Retention (org policy, parent consent/revocation, automatic deletion) is **not** implemented yet. Soft-delete keeps an audit row until that ticket.

Class photos may later use `studentIds[]` / `visibility`. Do not add those fields until that ticket.

### Notification

In-app record of something queued or sent to a user. FCM delivery is a side effect; the journey event remains the source of truth.

| Field | Type | Notes |
| --- | --- | --- |
| organizationId | ObjectId | From auth, never from the client |
| userId | ObjectId | Recipient. Resolved from guardian links, never from the client |
| studentId | ObjectId | |
| type | enum | `STUDENT_ARRIVAL`, `STUDENT_DEPARTURE`, `STUDENT_HOME_DROPOFF`, `JOURNEY_UPDATE`, `MEDIA_AVAILABLE` |
| title / body | string | Factual parent copy. No implied safety/mood |
| data | object | IDs only (`type`, `studentId`, `eventId` / `mediaId`, `notificationId`). No QR tokens or storage URLs |
| status | enum | `PENDING`, `SENT`, `FAILED`, `READ`. SENT means submitted to FCM |
| sentAt | Date? | UTC |
| readAt | Date? | UTC. Set when the parent opens it |

`device_tokens` stores FCM tokens per user/device (`ACTIVE` \| `INACTIVE`). Unique on `token` and `{ organizationId, userId, deviceId }`.

`notification_preferences` is one row per user: `journeyUpdates`, `studentArrival`, `studentDeparture`, `homeDropoff`, `mediaAvailable`. Quiet hours wait for a later ticket.

## Collections (v1 plan)

Implement collections when the matching ticket lands, not all at once.

| Collection | Tenant field | Soft-delete | First ticket |
| --- | --- | --- | --- |
| `organizations` | n/a (root) | inactive via status | TENANT-001 |
| `campuses` | organizationId | status (`INACTIVE`) | STUDENT-001 |
| `classrooms` | organizationId | status (`INACTIVE`) | STUDENT-001 |
| `users` | organizationId | no (INACTIVE status) | AUTH-001 |
| `refresh_tokens` | organizationId | revoke via `revokedAt` | AUTH-001 |
| `students` | organizationId | status (`INACTIVE` / `TRANSFERRED` / `GRADUATED`) | STUDENT-001 |
| `student_guardians` | organizationId | hard-remove link | STUDENT-001 |
| `student_events` | organizationId | append-only | JOURNEY-001 |
| `attendance` | organizationId | no | ATTENDANCE-001 |
| `buses` | organizationId | status | BUS-001 |
| `bus_routes` | organizationId | status | BUS-001 |
| `bus_stops` | organizationId | no | BUS-001 |
| `route_segments` | organizationId | no | BUS-001 |
| `student_transport_assignments` | organizationId | `active` / `effectiveTo` | BUS-001 |
| `daily_transport_plans` | organizationId | no | BUS-001 |
| `route_progress` | organizationId | no | BUS-001 |
| `activities` | organizationId | optional deletedAt | ACTIVITY-001 |
| `media` | organizationId | deletedAt | MEDIA-001 |
| `notifications` | organizationId | no | NOTIF-001 |
| `device_tokens` | organizationId | status (`INACTIVE`) | NOTIF-001 |
| `notification_preferences` | organizationId | no | NOTIF-001 |

There is no `guardians` collection. Guardian rows would duplicate `users`.

## Indexes

All tenant collections: `{ organizationId: 1 }` is never enough alone. Prefer compound indexes that match real queries.

| Collection | Index | Purpose |
| --- | --- | --- |
| users | unique `{ email: 1 }` | Login |
| users | `{ organizationId: 1, role: 1 }` | Staff lists |
| refresh_tokens | unique `{ jti: 1 }` | Refresh lookup |
| refresh_tokens | `{ userId: 1 }` | Logout / revoke |
| campuses | `{ organizationId: 1, name: 1 }` | List |
| classrooms | `{ organizationId: 1, campusId: 1 }` | List by campus |
| students | unique `{ organizationId: 1, qrToken: 1 }` | QR lookup |
| students | unique `{ organizationId: 1, studentNumber: 1 }` | Org student number |
| students | `{ organizationId: 1, classroomId: 1 }` | Class roster |
| student_guardians | unique `{ organizationId: 1, studentId: 1, userId: 1 }` | Link |
| student_guardians | `{ organizationId: 1, userId: 1 }` | Parent's children |
| `student_events` | `{ organizationId: 1, studentId: 1, occurredAt: -1 }` | Timeline / latest |
| `student_events` | `{ organizationId: 1, studentId: 1, eventType: 1, occurredAt: -1 }` | Type-specific queries |
| attendance | unique `{ organizationId: 1, studentId: 1, date: 1 }` | Daily roll-up |
| attendance | `{ organizationId: 1, studentId: 1, scannedAt: -1 }` | Student history |
| attendance | `{ organizationId: 1, scannedAt: -1 }` | Daily staff list |
| attendance | `{ organizationId: 1, classroomId: 1, date: 1 }` | Class roll |
| buses | `{ organizationId: 1, status: 1 }` | Active buses |
| bus_routes | `{ organizationId: 1, campusId: 1, status: 1 }` | Campus routes |
| bus_stops | `{ organizationId: 1, routeId: 1, sequence: 1 }` | Ordered stops |
| route_segments | `{ organizationId: 1, routeId: 1, fromStopId: 1, toStopId: 1 }` | ETA segments |
| student_transport_assignments | `{ organizationId: 1, studentId: 1, direction: 1 }` | Child's routes |
| student_transport_assignments | `{ organizationId: 1, routeId: 1, stopId: 1 }` | Shared-stop children |
| daily_transport_plans | `{ organizationId: 1, studentId: 1, date: 1, direction: 1 }` | Day override |
| media | `{ organizationId: 1, studentId: 1, capturedAt: -1 }` | Child photo gallery |
| notifications | `{ organizationId: 1, userId: 1, createdAt: -1 }` | Inbox |
| notifications | `{ organizationId: 1, userId: 1, readAt: 1, createdAt: -1 }` | Unread |
| device_tokens | `{ organizationId: 1, userId: 1, status: 1 }` | Active devices |
| device_tokens | unique `{ token: 1 }` | Replace/deactivate |
| notification_preferences | unique `{ organizationId: 1, userId: 1 }` | One preference row |

## Repository rule

Every read/write of tenant data takes `organizationId` from the authenticated context, not from a client-supplied body alone. Lookups by `_id` always include `organizationId` in the filter.

Cross-tenant access is a failed query, not an empty coincidence.
