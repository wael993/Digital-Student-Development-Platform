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
- [Authorization](architecture/authorization.md) — roles, permissions, 401 vs 403, resource scope
- [Security](architecture/security.md) — authn/authz boundaries, media, audit

## Local setup

Local environment and how to run the stack: root [README](../README.md).

## What to implement next

ARCH-001 through BUS-001 are done. Remaining order: ACTIVITY-001, PROFILE-001, SCHOOL-001, then AI-001. See [DOC-001](DOC-001-product-vision.md).
