# Digital Student Development Platform

Monorepo for the Digital Student education platform.

- **Flutter / Dart** — Android and iOS (phone and tablet)
- **Node.js / Express / TypeScript** — backend API
- **MongoDB** — database
- **Redis** — caching and background jobs (infrastructure only in this setup)
- **Docker Compose** — local API, MongoDB, and Redis

No Windows, macOS desktop, Linux desktop, or Web app is included.

## Requirements

Install these tools before setting up the project:

| Tool | Version |
| --- | --- |
| Node.js | 20 or later (22 recommended) |
| npm | 10 or later (bundled with Node.js) |
| Flutter SDK | 3.47 or later (stable) |
| Dart | bundled with Flutter |
| Docker | 24 or later |
| Docker Compose | v2 or later (`docker compose`) |
| Android SDK | required to build/run on Android |
| JDK | 17 or later (required for Android Gradle builds) |
| Xcode | required to build/run on iOS (macOS) |

Check versions:

```bash
node -v
npm -v
flutter --version
docker --version
docker compose version
```

## Installation

```bash
git clone https://github.com/wael993/Digital-Student-Development-Platform.git
cd Digital-Student-Development-Platform

npm install
cd apps/mobile && flutter pub get && cd ../..
```

## Environment setup

Create local environment files from the examples. Do not commit `.env` files.

```bash
chmod +x infrastructure/scripts/setup-env.sh
./infrastructure/scripts/setup-env.sh
```

Or copy them manually:

```bash
cp .env.example .env
cp apps/mobile/.env.example apps/mobile/.env
```

Root `.env` is used by the API and Docker Compose. Placeholders:

- `NODE_ENV`, `PORT`
- MongoDB: `MONGODB_HOST`, `MONGODB_DATABASE`, `MONGODB_USERNAME`, `MONGODB_PASSWORD` (or a full `MONGODB_URI`)
- Redis: `REDIS_HOST`, `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD` (or a full `REDIS_URL`). Leave Redis empty to disable BullMQ; notifications then run in-process
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
- `API_PUBLIC_URL`, `MEDIA_MAX_UPLOAD_BYTES`, `MEDIA_SIGNED_URL_TTL_SECONDS`, `MEDIA_STORAGE_DIR` (local fallback when Cloudinary is unset)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (authenticated student photos; short-lived signed URLs)
- `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY` (Firebase Admin for push; leave empty in local/dev)
- `AI_API_KEY` (reserved)

`apps/mobile/.env` contains `API_BASE_URL`. The live API is `https://digital-student-development-platform.onrender.com/api/v1`. Optional Firebase keys (`FIREBASE_PROJECT_ID`, `FIREBASE_API_KEY`, `FIREBASE_APP_ID`, `FIREBASE_MESSAGING_SENDER_ID`) enable FCM; without them the app still works and in-app notifications remain available.

## Running the project

### API (recommended)

Starts the API plus local Mongo and Redis containers. The API still reads Mongo/Redis from `.env` (Atlas + Redis Cloud in this project). Local Redis is used only if `REDIS_URL` / `REDIS_HOST` points at `localhost:6379`.

```bash
docker compose up --build
```

Verify the API:

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:

```json
{"status":"ok"}
```

Stop the stack with `Ctrl+C`, or `docker compose down`.

### API on the host

Use this when you want hot reload via `npm run dev` on your machine.

1. Copy `.env.example` to `.env` and fill MongoDB + Redis credentials.
2. Start the API:

```bash
npm run dev
```

The API listens on `http://localhost:3000`.

### API on Render

Root Directory stays empty. `render.yaml` sets Node 22, `npm ci --include=dev && npm run build`, `npm start`, and health check `/api/v1/health`.

If the service already exists in the dashboard, use those same build/start commands (do not set Root Directory to `apps/api`). Required env vars: `NODE_ENV=production`, Atlas MongoDB, new `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`, `API_PUBLIC_URL=https://<service>.onrender.com`, and Cloudinary. Redis and FCM can stay empty at first.

API tests use local MongoDB on `localhost:27017` (`dev-platform-test`), not Atlas:

```bash
docker compose up mongo -d
npm test
```

Local Redis listens on `localhost:6379`. To use it instead of Redis Cloud, set `REDIS_URL=redis://localhost:6379` (from `npm run dev` on the host). If the API runs inside Compose, use `REDIS_URL=redis://redis:6379`. For Redis Cloud, set `maxmemory-policy` to `noeviction` in the Redis console so BullMQ keys are not evicted.

Create the Arabic demo academy (63 students, both campuses, buses, journeys):

```bash
npm run seed
```

Password for every seed user: `Demo@12345`

See [apps/api/src/database/seed/README.md](apps/api/src/database/seed/README.md) for the full login table.

| Email | Role | What you’ll see |
| --- | --- | --- |
| `mohammed.alotaibi+guardian@demo.local` | GUARDIAN | آدم (on the morning bus) and سارة |
| `sara.aldosari+guardian@demo.local` | GUARDIAN | يوسف (absent) and ليان |
| `teacher.mariam@demo.local` | TEACHER | روضة النخيل أ |
| `supervisor.khalid@demo.local` | SUPERVISOR | حرم النخيل |
| `admin.ahmad@demo.local` | ADMIN | أكاديمية براعم المستقبل |
| `driver.saad@demo.local` | DRIVER | حافلة النخيل 1 (route in progress) |

`npm run seed:reset` wipes that demo organization and seeds it again. It is blocked when `NODE_ENV=production`.

Useful commands (run from the repository root):

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API in watch mode |
| `npm run build` | Compile TypeScript |
| `npm run lint` | Run ESLint |
| `npm run format` | Format API sources with Prettier |
| `npm test` | Run API tests |
| `npm run seed` | Upsert the Arabic demo academy (63 students) |
| `npm run seed:reset` | Wipe the demo organization and seed it again (dev/test only) |
| `npm run typecheck` | TypeScript strict check (`tsc --noEmit`) |

### Flutter application

```bash
cd apps/mobile
cp .env.example .env   # if you have not already
flutter pub get
flutter run
```

Pick an Android phone/tablet or iPhone/iPad simulator or device.

Quality checks:

```bash
cd apps/mobile
flutter analyze
flutter test
```

Android debug build:

```bash
cd apps/mobile
flutter build apk --debug
```

Android release (رحلتي, live API):

```bash
cd apps/mobile
flutter build apk --release \
  --dart-define=API_BASE_URL=https://digital-student-development-platform.onrender.com/api/v1
```

APK: `apps/mobile/build/app/outputs/flutter-apk/app-release.apk`. Sideload that, or use Play internal testing with `flutter build appbundle --release` and the same `--dart-define`.

Release signing uses the debug keystore until you add `apps/mobile/android/key.properties` (gitignored) and a `.jks`. Play Console needs that upload key before a store listing.

iOS is configured in `apps/mobile/ios` (iPhone and iPad). Open the Xcode workspace on macOS when you need to run on a simulator or device:

```bash
open apps/mobile/ios/Runner.xcworkspace
```

## Project structure

```
apps/mobile/              Flutter Android + iOS app
apps/api/                 Express + TypeScript API
packages/shared/          Reserved for shared types
infrastructure/docker/    Dockerfiles
infrastructure/scripts/   Helper scripts
docs/                     Product + architecture documentation
.github/workflows/        CI
```

API versioning uses the `/api/v1` prefix (for example `GET /api/v1/health`).

## Documentation

- [docs/README.md](docs/README.md) — index
- [DOC-001 Product vision](docs/DOC-001-product-vision.md)
- [Domain model](docs/architecture/domain-model.md) (ARCH-001)
- [Backend architecture](docs/architecture/backend-architecture.md)
- [Mobile architecture](docs/architecture/mobile-architecture.md)
