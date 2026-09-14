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
- `MONGODB_URI`, `REDIS_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
- `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY` (reserved)
- `AI_API_KEY` (reserved)

`apps/mobile/.env` contains `API_BASE_URL` for the Flutter app.

## Running the project

### API, MongoDB, and Redis (recommended)

Starts the API, MongoDB, and Redis. You do not need to install MongoDB or Redis on the host.

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

### API on the host (MongoDB and Redis in Docker)

Use this when you want hot reload via `npm run dev` on your machine.

1. Copy `.env.example` to `.env` (values already point at `localhost`).
2. Start only the data services:

```bash
docker compose up mongo redis
```

3. Start the API:

```bash
npm run dev
```

The API listens on `http://localhost:3000`.

Create a local teacher you can log in with:

```bash
npm run seed
```

Credentials: `teacher@example.com` / `Password123!`

Useful commands (run from the repository root):

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API in watch mode |
| `npm run build` | Compile TypeScript |
| `npm run lint` | Run ESLint |
| `npm run format` | Format API sources with Prettier |
| `npm test` | Run API tests |
| `npm run seed` | Upsert the local teacher login (`teacher@example.com`) |
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
