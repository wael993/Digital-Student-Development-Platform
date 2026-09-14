# DOC-001 — Product Vision & Technical Documentation

## Goal

Create the initial product and technical documentation that defines what we are building, why we are building it, the main users of the platform, the expected application experience, and the high-level technical direction.

This documentation will act as the reference point for the development team throughout the project and will help ensure that infrastructure, backend, mobile application, database, and future features are built toward the same product vision.

## Product Vision

We are building a mobile/tablet-based education management platform that digitizes the daily journey of children in nurseries and schools.

The platform connects:

- School administration
- Supervisors
- Teachers
- Bus drivers
- Parents/guardians
- Students

The main goal is to replace fragmented paper-based processes with a single platform where the school can record a child's daily activities and parents can stay informed about their child's day.

The platform will initially target nurseries/kindergartens and will later expand to:

- Primary schools
- Middle schools
- High schools

The system must therefore be designed from the beginning to support multiple educational stages.

## Main Product Concept

Each student has a digital daily journey.

For example:

```
Home
  ↓
Bus Boarding
  ↓
Bus Journey
  ↓
School Arrival
  ↓
Classroom
  ↓
Activity
  ↓
Break
  ↓
Meal
  ↓
Skill Reinforcement
  ↓
Activities
  ↓
Bus Return
  ↓
Home Drop-off
```

Teachers and supervisors record important events during the day.

Parents can then see the child's current/latest status and a timeline of what happened during the day.

## Example Parent Experience

A parent opens the application and sees:

```
Good Morning 👋

Sarah
Nursery Class A

Today's Journey

08:02  ✓ Bus boarded
08:28  ✓ Arrived at nursery
08:35  ✓ Classroom started
10:15  ✓ Morning activity
10:45  ✓ Break
11:30  ✓ Skill reinforcement
12:15  ✓ Lunch
13:00  ✓ Activity
15:20  ✓ Bus departure

Current Status

🚌 On the way home

Estimated arrival:
15:48
```

The parent can also receive:

- Attendance information
- Daily activities
- Teacher notes
- Homework/activities
- Child photos
- Group photos they are authorized to view
- Mood information
- Food/sleep information where applicable
- Important school notifications

## Example Teacher Experience

A teacher opens the mobile application and sees their classroom:

```
Class A

Students: 18

✓ Ahmed
✓ Sarah
✓ John
✗ Emma
✓ Daniel
...
```

The teacher can:

- Record attendance
- Scan student QR codes
- Record student events
- Add activities
- Record observations
- Add behavioral notes
- Upload photos
- Assign activities/homework
- Record meals/sleep/mood where applicable
- View relevant student information

The teacher should not have access to students outside their authorized scope.

## Example Supervisor Experience

The supervisor has a broader view:

```
Today's Overview

Students: 120
Present: 113
Absent: 7

Buses:
Bus 01 → On route
Bus 02 → At nursery
Bus 03 → Returning students

Alerts:
3 students have not completed arrival check
2 parent notifications pending
```

The supervisor can monitor the overall daily operation and intervene when necessary.

## Example Bus Driver Experience

The driver uses the same mobile application but sees a different interface based on their role.

Example:

```
Morning Route

1. Ahmed       ✓ Boarded
2. Sarah       ✓ Boarded
3. John        ○ Waiting
4. Emma        ✓ Boarded

Start Route
```

During the return journey:

```
Home Drop-off

1. Ahmed       ✓ Delivered
2. Sarah       ○ Next
3. John        ○ Waiting
```

QR scanning can be used to verify boarding and drop-off events.

## QR Code Concept

Each student will have a QR code containing a random student identifier.

The QR code must not contain sensitive personal information.

Example:

```
QR Code
   ↓
Student Identifier
   ↓
API
   ↓
Validate user permission
   ↓
Create Student Event
```

Example event:

```
BUS_BOARDING
studentId: xxx
timestamp: 08:02
recordedBy: driver
```

The event becomes part of the student's journey history.

## Core Architecture Concept

The platform will use a multi-tenant architecture.

The basic hierarchy is:

```
Organization
    ↓
Campus / Branch
    ↓
Classroom
    ↓
Students
    ↓
Guardians
```

Other operational entities include:

- Users
- Roles
- Teachers
- Staff
- Buses
- Routes
- Activities
- Student Events
- Attendance
- Media
- Notifications
- Messages

Every request must be scoped to the correct organization/tenant.

## Student Journey

The student's journey is one of the most important concepts in the platform.

Instead of storing only a current status such as:

```
student.status = "IN_CLASS"
```

we will maintain an event history.

Example:

```
StudentEvent

08:02  BUS_BOARDING
08:28  SCHOOL_ARRIVAL
08:35  CLASS_STARTED
10:15  ACTIVITY_STARTED
10:45  BREAK_STARTED
11:30  SKILL_SESSION
12:15  MEAL
15:20  BUS_RETURN
15:48  HOME_DROPOFF
```

This allows the platform to provide:

- Live/latest status
- Daily timeline
- Historical reports
- Notifications
- Analytics
- Future AI context

## AI Vision

AI will be introduced as a supporting capability rather than the source of truth.

The recorded student journey, attendance, notes, and operational data remain authoritative. AI may later assist with daily report drafts, teacher summaries, and insights grounded in that history.

AI must not invent student events, attendance, or status. AI-001 comes after the operational platform exists.

## Recommended Development Sequence

```
DOC-001
Product Vision & Technical Documentation
        ↓
INFRA-001
Project Infrastructure & Development Environment
        ↓
ARCH-001
Domain Model & MongoDB Architecture
        ↓
AUTH-001
Authentication & User Management
        ↓
TENANT-001
Multi-Tenancy & RBAC
        ↓
STUDENT-001
Student / Guardian / Classroom Management
        ↓
ATT-001
Attendance + QR Scanning
        ↓
JOURNEY-001
Student Journey & Event Timeline
        ↓
PARENT-001
Parent Dashboard & Daily Journey
        ↓
MEDIA-001
Photos & Media
        ↓
NOTIF-001
Push Notifications
        ↓
BUS-001
Bus Routes & Boarding / Drop-off
        ↓
AI-001
AI-Assisted Daily Reports / Teacher Assistance
```
