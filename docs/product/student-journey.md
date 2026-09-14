# Student Journey

The student's day is a list of `StudentEvent` records, not a single `student.status` flag.

DOC-001 product examples stay valid. This file is the technical contract for JOURNEY-001.

## Why events

From events the product can derive:

- Latest / current status
- Daily timeline (parent home)
- Historical journey
- Notification triggers
- Attendance correlation
- Reports and analytics
- Later AI context (read-only over this history; AI must not invent events)

Optional cache on `students.currentStatus` / `currentStatusAt` may be updated when an event is inserted. The cache is a read optimization. Recompute from the latest non-voided event if it drifts.

## Example day

```
08:02  BUS_BOARDING
08:28  SCHOOL_ARRIVAL
08:35  CLASS_STARTED
10:15  ACTIVITY_STARTED
10:45  BREAK_STARTED
11:30  SKILL_SESSION
12:15  MEAL
15:20  BUS_DEPARTURE
15:48  HOME_DROPOFF
```

DOC-001's `BUS_RETURN` is this model's `BUS_DEPARTURE` (bus left campus toward homes). `HOME_DROPOFF` is the stop at home.

Not every child uses the bus. `PARENT_PICKUP` covers collection at school.

## Event types (v1)

Closed enum. New types require a ticket; do not accept arbitrary strings from the client.

| Type | Meaning |
| --- | --- |
| `BUS_BOARDING` | Child boarded (usually morning) |
| `SCHOOL_ARRIVAL` | Arrived at campus (bus or walk-in) |
| `CLASS_STARTED` | Class session began |
| `BREAK_STARTED` | Break began |
| `ACTIVITY_STARTED` | Named activity began |
| `SKILL_SESSION` | Skill reinforcement |
| `MEAL` | Meal / snack |
| `NOTE` | Staff observation (mood, behavior, free text in metadata) |
| `BUS_DEPARTURE` | Bus left campus |
| `HOME_DROPOFF` | Delivered at home stop |
| `PARENT_PICKUP` | Guardian collected at school |

Future (do not implement now): `SLEEP`, `HOMEWORK`, GPS breadcrumbs. Mood/food/sleep from the parent mock can live in `NOTE` or `MEAL` metadata until those tickets exist.

## Mandatory fields vs metadata

**Mandatory on every event**

| Field | Why |
| --- | --- |
| `organizationId` | Tenant |
| `studentId` | Subject |
| `type` | What happened |
| `occurredAt` | When it happened (staff clock; may differ from `createdAt`) |
| `recordedBy` | Who wrote it |

**First-class optional (queryable, not dumped in metadata)**

`campusId`, `classroomId`, `busId`, `routeId`, `activityId`, `mediaIds`, `clientRequestId`

**metadata** — type-specific, not indexed:

```json
{
  "note": "Ate most of lunch",
  "mood": "HAPPY",
  "activityName": "Morning circle"
}
```

Do not put `studentId` or `organizationId` only inside `metadata`. Do not put PII that belongs on `students` or `users` (home address, national id).

## Current status

Latest non-voided event by `occurredAt` (tie-break `_id`). Parent "current status" maps that type to copy ("On the way home", etc.) in PARENT-001. Mapping is presentation, not a second database enum.

## Daily timeline

Query: `{ organizationId, studentId, occurredAt: { $gte: start, $lt: end }, voidedAt: null }` sorted by `occurredAt`.

Use org-local calendar dates for "today". Store `occurredAt` in UTC.

## History, notifications, reports, AI

| Use | Mechanism |
| --- | --- |
| History | Same query, wider range, cursor pagination |
| Notifications | Service after insert: if guardian `receivesNotifications`, enqueue `notifications` (+ FCM in NOTIF-001) |
| Reports | Aggregate events + `attendance` by day/class |
| AI | Later read-only consumer of events/notes. Cannot insert journey facts |

## Attendance vs journey

QR scan (ATTENDANCE-001) typically:

1. Resolves `qrToken` → student in this org
2. Checks caller scope
3. Upserts `attendance` for the local date
4. Inserts `SCHOOL_ARRIVAL` or `BUS_BOARDING` (JOURNEY-001 may absorb step 4)

Two collections, one staff action. Attendance answers "present today?"; events answer "what happened, in order?".

## Idempotency and corrections

- Repeat QR: same `clientRequestId` (or debounce per student/type/window) must not duplicate the timeline
- Wrong event: set `voidedAt` / `voidedBy` / `voidReason`. Insert a replacement if needed
- No silent overwrite of `type` / `occurredAt` on an existing row

## QR

```
QR (qrToken)
  → API
  → tenant + permission
  → StudentEvent (+ attendance when relevant)
```

The token is not a capability by itself. A stolen QR without a permitted staff session does nothing useful.
