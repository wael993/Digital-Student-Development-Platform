# User Roles

Same Flutter app, different scope. Students are not a login role in v1.

Canonical roles:

`ADMIN` · `SUPERVISOR` · `TEACHER` · `DRIVER` · `GUARDIAN`

A user may hold more than one role in the same organization (teacher who is also a parent). Services union the scopes. Empty scope for a role still means no access through that role.

Details of JWT and middleware: AUTH-001 implements a single `role` per user. TENANT-001 enforces permissions via `authorize()`. A user may hold more than one role later if needed.

## High-level scope

| Role | Main scope | Typical job |
| --- | --- | --- |
| ADMIN | Organization | Users, campuses, classrooms, settings |
| SUPERVISOR | Assigned campuses | Daily operations, exceptions, buses at site |
| TEACHER | Assigned classrooms | Roster, attendance, class events, notes, photos |
| DRIVER | Assigned routes | Boarding, route progress, home drop-off |
| GUARDIAN | Linked children | Read journey, attendance, authorized media, notifications |
| Student | — | Not authenticated |

## Permission matrix

R = read, W = create/update in scope, — = no.

| Resource | ADMIN | SUPERVISOR | TEACHER | DRIVER | GUARDIAN |
| --- | --- | --- | --- | --- | --- |
| Organization profile | R/W | R | R | R | R |
| Campuses | R/W | R (assigned) | R (own campus) | R (own campus) | — |
| Classrooms | R/W | R (campus) | R (assigned) | — | — |
| Users / invites | R/W | R (campus staff) | — | — | — |
| Students | R/W org | R/W campus | R/W class | R route students | R own children |
| Guardian links | R/W | R/W campus | R class | — | R own links |
| Attendance | R/W org | R/W campus | R/W class | — | R own children |
| Student events | R/W org | R/W campus | W class journey types | W transport types | R own children |
| Buses / routes | R/W | R/W campus | R classroom arrivals | R/W assigned routes | R own children (plan / ETA) |
| Activities | R/W | R/W campus | R/W class | — | R own child's class |
| Media | R/W | R/W campus | W class, R class | — | R own child's media |
| Notifications | send org | send campus | send class parents | — | R own inbox |

Guardian **W** on events/attendance is not allowed. Parents observe; staff record.

## Event types by role

| Types | Who writes |
| --- | --- |
| `ATTENDANCE_PRESENT` | Attendance QR flow (not `POST /events`) |
| `BUS_BOARDING`, `BUS_DEPARTURE`, `HOME_DROPOFF`, `MISSED_BUS` | DRIVER, SUPERVISOR, ADMIN |
| `SCHOOL_ARRIVAL`, `ARRIVED_BY_CAR`, `NOT_PRESENT_AT_CLASS_CHECK` | TEACHER, SUPERVISOR, ADMIN (DRIVER may bulk-register school arrivals on an assigned route) |
| `PARENT_PICKUP`, `AUTHORIZED_PICKUP` | TEACHER, SUPERVISOR, ADMIN (`AUTHORIZED_PICKUP` requires a guardian with `canPickup`) |
| `TRANSPORT_CANCELLED` | Parent cancel API (not `POST /events`) |
| `CLASS_STARTED`, `BREAK_STARTED`, `ACTIVITY_STARTED`, `MEAL`, `SKILL_SESSION` | TEACHER, SUPERVISOR, ADMIN |

## Data rules

- **ADMIN** — all rows in the organization. Not other organizations.
- **SUPERVISOR** — `campusIds` on the user. Empty array = no campuses, not all campuses.
- **TEACHER** — `classroomIds`. Cannot load a student whose `classroomId` is outside that set.
- **DRIVER** — `routeIds`. Student must have an active `StudentTransportAssignment` on one of those routes.
- **GUARDIAN** — `student_guardians.userId`. Multiple children allowed. No classroom roster.

## Out of scope for these roles

Platform operator (multi-org superadmin), student login, and medical-role accounts are not in v1.
