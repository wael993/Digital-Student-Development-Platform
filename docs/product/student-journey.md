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

Do not store `currentState` as the source of truth. It is derived from the latest event by `occurredAt` (tie-break `_id`). A cache on `students` can wait until a later performance ticket.

## Example day

```
07:42  ATTENDANCE_PRESENT
08:03  BUS_BOARDING
08:27  SCHOOL_ARRIVAL
08:35  CLASS_STARTED
10:15  BREAK_STARTED
10:45  ACTIVITY_STARTED
12:00  MEAL
13:10  SKILL_SESSION
14:30  BUS_DEPARTURE
15:05  HOME_DROPOFF
```

DOC-001's `BUS_RETURN` is this model's `BUS_DEPARTURE` (bus left campus toward homes). `HOME_DROPOFF` is the stop at home.

Not every child uses the bus. Walk-in days can start at `ATTENDANCE_PRESENT` or `SCHOOL_ARRIVAL`.

## Event types (v1)

Closed enum. New types require a ticket; do not accept arbitrary strings from the client.

| Type | Meaning |
| --- | --- |
| `ATTENDANCE_PRESENT` | Written by ATTENDANCE-001 when a QR scan records PRESENT |
| `BUS_BOARDING` | Child boarded (usually morning). QR boarding writes this. |
| `SCHOOL_ARRIVAL` | Arrived at campus (bus or walk-in) |
| `ARRIVED_BY_CAR` | Arrived by parent car — not a boarding event |
| `NOT_PRESENT_AT_CLASS_CHECK` | Teacher marked not arrived yet. Not the same as all-day `SCHOOL_ABSENT` (not a v1 type). Later arrival is a new event. |
| `PARENT_PICKUP` | Left with a parent before the afternoon bus |
| `AUTHORIZED_PICKUP` | Left with a guardian who has `canPickup`. Dedicated pickup people wait for PROFILE-001. |
| `MISSED_BUS` | Missed the scheduled bus |
| `TRANSPORT_CANCELLED` | Parent cancelled bus for a date/direction. Permanent assignment stays. |
| `CLASS_STARTED` | Class session began |
| `BREAK_STARTED` | Break began |
| `ACTIVITY_STARTED` | Named activity began |
| `SKILL_SESSION` | Skill reinforcement |
| `MEAL` | Meal / snack |
| `BUS_DEPARTURE` | Bus left campus |
| `HOME_DROPOFF` | Delivered at home stop |

Future (do not implement now): `NOTE`, `SLEEP`, `HOMEWORK`, GPS breadcrumbs. ACTIVITY-001 owns `NOTE` / `HOMEWORK` and teacher observations. Mood/food/sleep from the parent mock can live in `NOTE` or `MEAL` metadata until those tickets exist. Dedicated authorized-pickup *people* (beyond `student_guardians.canPickup`) wait for PROFILE-001. Live GPS is BUS-002.

## Mandatory fields vs metadata

**Mandatory on every event**

| Field | Why |
| --- | --- |
| `organizationId` | Tenant. Always from auth, never from the client |
| `studentId` | Subject. From the route |
| `eventType` | What happened |
| `occurredAt` | When it happened (staff clock; may differ from `recordedAt`) |
| `recordedAt` | When the system stored it |
| `recordedBy` | Who wrote it (from auth) |
| `source` | `MANUAL` \| `QR` \| `SYSTEM` \| `MANUAL_BULK` |

**metadata** — type-specific, not indexed:

```json
{
  "attendanceId": "...",
  "mealType": "LUNCH",
  "skill": "Fine Motor Skills"
}
```

Do not put `studentId` or `organizationId` only inside `metadata`. Do not put PII that belongs on `students` or `users` (home address, national id).

## Current status

Latest event by `occurredAt` (tie-break `_id`). Parent "current status" maps that type to copy ("On the way home", etc.) in PARENT-001. Mapping is presentation, not a second database enum.

## Daily timeline

Query: `{ organizationId, studentId, occurredAt: { $gte: start, $lt: end } }` sorted by `occurredAt` ascending.

Use org-local calendar dates for "today". Store `occurredAt` in UTC.

`GET /api/v1/students/:studentId/events?date=YYYY-MM-DD` (date defaults to today) returns `{ data: [events] }` in chronological order.

`GET /api/v1/students/:studentId/journey/today` returns `{ student, currentState, events }`.

`POST /api/v1/students/:studentId/events` creates a `MANUAL` event. Guardians cannot create events. `ATTENDANCE_PRESENT` is not accepted on this endpoint.

## History, notifications, reports, AI

| Use | Mechanism |
| --- | --- |
| History | Same query, wider range, cursor pagination later |
| Notifications | Service after insert: if guardian `receivesNotifications`, enqueue `notifications` and FCM via `notificationQueue` (NOTIF-001). Failed delivery does not roll back the event. |
| Reports | Aggregate events + `attendance` by day/class |
| AI | Later read-only consumer of events/notes. Cannot insert journey facts |

Realtime push (`student.journey.updated`) waits for a dedicated ticket. v1 refreshes after the POST response.

## Attendance vs journey

QR scan (ATTENDANCE-001 + JOURNEY-001):

1. Resolves `qrToken` → student in this org
2. Checks caller scope
3. Upserts `attendance` for the local date (`PRESENT`)
4. Inserts `ATTENDANCE_PRESENT` with `source: QR` and `metadata.attendanceId`

Two collections, one staff action. Attendance answers "present today?"; events answer "what happened, in order?". Flutter must not POST both independently.

Duplicate attendance (`ALREADY_RECORDED`) does not insert a second journey event. If the event insert failed after attendance, a later scan repairs it.

## Idempotency and corrections

- Repeat tap of the same `eventType` for the same student inside a short window is rejected
- Same type later in the day is allowed
- No PATCH/DELETE of events. Corrections are a later explicit workflow
- No silent overwrite of `eventType` / `occurredAt` on an existing row

## Transitions

v1 only rejects obviously invalid sequences on the same org-local day (`HOME_DROPOFF` then anything; `BUS_DEPARTURE` then an in-school event). It does not require every type to occur, and it allows `CLASS_STARTED` → `ACTIVITY_STARTED` → `BREAK_STARTED`. `NOT_PRESENT_AT_CLASS_CHECK` then `ARRIVED_BY_CAR` is allowed; both stay on the timeline.

## QR

```
QR (qrToken)
  → API
  → tenant + permission
  → attendance PRESENT + StudentEvent ATTENDANCE_PRESENT
     or transport boarding BUS_BOARDING (direction from the day's plan)
```

The token is not a capability by itself. A stolen QR without a permitted staff session does nothing useful. Boarding QR uses the same random `qrToken`; it is not a second code.

