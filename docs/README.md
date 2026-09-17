# Documentation

Project documentation for the Digital Student platform.

## how to run simulator

- flutter devices
- for android: flutter emulators --launch Medium_Phone
- for ios : flutter emulators --launch apple_ios_simulator
- flutter run -d <id>

## Product

- [DOC-001 Product Vision](DOC-001-product-vision.md) — what we are building and for whom
- [User roles](product/user-roles.md) — PLATFORM_ADMIN, ADMIN, SUPERVISOR, TEACHER, DRIVER, GUARDIAN
- [Roles and access](product/roles-and-access.md) — what each role can see and do, platform provisioning, tenant onboarding
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
- [Multi-tenancy](architecture/multi-tenancy.md) — organizationId, platform vs tenant, repository isolation
- [Authorization](architecture/authorization.md) — roles, permissions, platform admin, 401 vs 403, resource scope
- [Security](architecture/security.md) — authn/authz boundaries, invitations, media, audit

## Local setup

Local environment and how to run the stack: root [README](../README.md).

## What to implement next

PLATFORM-001 Slice 1 (API platform layer) and PLATFORM-002 (platform owner bootstrap auth) are done. Product sequence remaining: ACTIVITY-001, PROFILE-001, SCHOOL-001, then AI-001. PLATFORM-001 Slice 2 (Flutter console + tenant `/users` CRUD) can land independently. See [DOC-001](DOC-001-product-vision.md).
