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

School / company / tenant.

| Field | Type | Notes |
| --- | --- | --- |
| name | string | |
| type | enum | Planned (`NURSERY`, `KINDERGARTEN`, `PRIMARY`, `MIDDLE`, `HIGH`, `MIXED`). Not stored in TENANT-001. |
| status | enum | `ACTIVE`, `INACTIVE` |
| timezone | string | IANA timezone. Default `UTC`. ATTENDANCE-001 uses this for “today”. |

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
| organizationId | ObjectId | v1: exactly one org |
| email | string | Unique globally in v1 |
| passwordHash | string | Never returned by the API |
| firstName | string | |
| lastName | string | |
| role | enum | `ADMIN`, `SUPERVISOR`, `TEACHER`, `DRIVER`, `GUARDIAN` |
| status | enum | `ACTIVE`, `INACTIVE` |
| campusIds | ObjectId[] | SUPERVISOR assignment; empty = no campuses |
| classroomIds | ObjectId[] | TEACHER assignment; empty = no classes |

Assignment scope: `campusIds` (supervisor) and `classroomIds` (teacher) are stored on the user. `routeIds` wait for BUS-001. Guardian child access is **not** stored on the user. It lives in `student_guardians`. Empty assignment lists mean no rows.

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

No hard delete. Historical attendance/journey tickets will keep referencing these rows.

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
| source | enum | `MANUAL`, `QR`, `SYSTEM` |
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
| source | enum | `QR` in v1. Later: `MANUAL`, `IMPORT`, `SYSTEM` |

Unique: one document per student per org date. Repeat QR scans for that date return `ALREADY_RECORDED`. Successful PRESENT also inserts `ATTENDANCE_PRESENT` on `student_events`.

### Bus

| Field | Type | Notes |
| --- | --- | --- |
| organizationId | ObjectId | |
| campusId | ObjectId? | |
| name | string | |
| plateNumber | string? | |
| status | enum | `ACTIVE`, `INACTIVE` |

### Route

Ordered transportation plan (morning or afternoon).

| Field | Type | Notes |
| --- | --- | --- |
| organizationId | ObjectId | |
| busId | ObjectId | |
| campusId | ObjectId | |
| name | string | |
| direction | enum | `INBOUND`, `OUTBOUND` |
| stopStudentIds | ObjectId[] | Ordered students / stops |
| driverIds | ObjectId[] | |
| status | enum | `ACTIVE`, `INACTIVE` |

GPS live tracking is out of scope until a later bus ticket.

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
| `routes` | organizationId | status | BUS-001 |
| `activities` | organizationId | optional deletedAt | later classroom work |
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
| routes | `{ organizationId: 1, busId: 1 }` | Bus routes |
| media | `{ organizationId: 1, studentId: 1, capturedAt: -1 }` | Child photo gallery |
| notifications | `{ organizationId: 1, userId: 1, createdAt: -1 }` | Inbox |
| notifications | `{ organizationId: 1, userId: 1, readAt: 1, createdAt: -1 }` | Unread |
| device_tokens | `{ organizationId: 1, userId: 1, status: 1 }` | Active devices |
| device_tokens | unique `{ token: 1 }` | Replace/deactivate |
| notification_preferences | unique `{ organizationId: 1, userId: 1 }` | One preference row |

## Repository rule

Every read/write of tenant data takes `organizationId` from the authenticated context, not from a client-supplied body alone. Lookups by `_id` always include `organizationId` in the filter.

Cross-tenant access is a failed query, not an empty coincidence.
