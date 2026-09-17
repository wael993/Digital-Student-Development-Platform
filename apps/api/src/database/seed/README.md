# Development seed

Realistic demo data for Digital Student. Safe for development and test only — never production.

```bash
npm run seed
npm run seed:reset   # wipes the demo organization, then seeds again
```

`seed:reset` refuses to run when `NODE_ENV=production`.

For the **production** platform owner (`wael@rivo.com`), use `npm run bootstrap:platform-admin` with `PLATFORM_BOOTSTRAP_*` secrets — not this demo seed. See `docs/architecture/security.md`.

## Organization

أكاديمية براعم المستقبل — timezone `Asia/Riyadh`

- حرم النخيل — 4 classrooms, 53 students
- حرم الندى — 1 classroom, 10 students

Password for every seeded user (bcrypt, not stored in plaintext): **`Demo@12345`**

## Staff

| Email                          | Role           | Scope          |
| ------------------------------ | -------------- | -------------- |
| `platform.admin@demo.local`    | PLATFORM_ADMIN | SaaS platform  |
| `admin.ahmad@demo.local`       | ADMIN          | Organization   |
| `admin.mona@demo.local`        | ADMIN          | Organization   |
| `supervisor.khalid@demo.local` | SUPERVISOR     | حرم النخيل     |
| `supervisor.huda@demo.local`   | SUPERVISOR     | حرم الندى      |
| `teacher.mariam@demo.local`    | TEACHER        | روضة النخيل أ  |
| `teacher.hana@demo.local`      | TEACHER        | روضة النخيل ب  |
| `teacher.najla@demo.local`     | TEACHER        | حضانة البراعم  |
| `teacher.samer@demo.local`     | TEACHER        | الصف الأول     |
| `teacher.reem@demo.local`      | TEACHER        | روضة الندى     |
| `driver.saad@demo.local`       | DRIVER         | حافلة النخيل 1 |
| `driver.fahad@demo.local`      | DRIVER         | حافلة النخيل 2 |
| `driver.tariq@demo.local`      | DRIVER         | حافلة الندى 1  |
| `driver.hassan@demo.local`     | DRIVER         | Unassigned     |

## Useful parent accounts

| Email                                   | Children                                           |
| --------------------------------------- | -------------------------------------------------- |
| `mohammed.alotaibi+guardian@demo.local` | آدم (on the morning bus), سارة                     |
| `sara.aldosari+guardian@demo.local`     | يوسف (absent), ليان (on the bus)                   |
| `ahmad.alzahrani+guardian@demo.local`   | عمر (at school, afternoon bus), جود (other campus) |
| `sadeen.alanazi+guardian@demo.local`    | Three children across both campuses                |

Guardian emails use `firstname.lastname+guardian@demo.local`.

Authorized pickup people are extra `GUARDIAN` users with relationship `OTHER` and `canPickup: true` (PROFILE-001 dedicated pickup records are not in v1).

## Notes

- QR tokens are random 32-char hex from `randomQrToken()`. Re-running `npm run seed` keeps existing tokens.
- Device tokens are fake (`dev-fcm-token-001`, …) and must not be sent to production FCM.
- Photos are generated placeholders under the normal `organizations/{org}/students/{id}/photos/...` keys.
- Bus stop reached/departed is stored as `RouteProgress`, not as `StudentEvent` types.
- ETA for a child at stop 6 while the bus is at stop 3 is computed from route segments (4+3+5+2+4 → 11 minutes remaining from stop 3).
