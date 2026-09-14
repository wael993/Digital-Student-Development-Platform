# Documentation

Project documentation for the Digital Student platform.

## how to run simulator

- flutter devices
- for android: flutter emulators --launch Medium_Phone
- for ios : flutter emulators --launch apple_ios_simulator
- flutter run -d <id>

## Product

- [DOC-001 Product Vision](DOC-001-product-vision.md) — what we are building and for whom
- [User roles](product/user-roles.md) — ADMIN, SUPERVISOR, TEACHER, DRIVER, GUARDIAN
- [Student journey](product/student-journey.md) — event types, timeline, attendance vs events

## Architecture (ARCH-001)

High-level flow:

```
Flutter
  → REST /api/v1
  → Express
  → Services
  → MongoDB

Redis / Object Storage / FCM  (supporting)
```

- [Domain model](architecture/domain-model.md) — entities, relationships, collections, indexes
- [Backend architecture](architecture/backend-architecture.md) — modules, layers, API conventions
- [Mobile architecture](architecture/mobile-architecture.md) — Flutter, Riverpod, Dio
- [Multi-tenancy](architecture/multi-tenancy.md) — organizationId, repository isolation
- [Security](architecture/security.md) — authn/authz boundaries, media, audit

## Local setup

Local environment and how to run the stack: root [README](../README.md).

## What to implement next

ARCH-001 and AUTH-001 are done. Next: TENANT-001 → STUDENT-001 → ATTENDANCE-001 → JOURNEY-001 → PARENT-001.
