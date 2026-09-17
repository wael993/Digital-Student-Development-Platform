/**
 * One-time platform owner bootstrap.
 *
 * Usage:
 *   PLATFORM_BOOTSTRAP_EMAIL=wael@rivo.com \
 *   PLATFORM_BOOTSTRAP_PASSWORD=<secret> \
 *   npm run bootstrap:platform-admin
 *
 * Never prints or logs the password. Idempotent if a PLATFORM_ADMIN already exists.
 */
import { connectMongo, disconnectMongo } from '../config/mongodb';
import { bootstrapPlatformAdmin } from '../modules/platform/platform-admin.service';

async function main(): Promise<void> {
  const email = process.env.PLATFORM_BOOTSTRAP_EMAIL?.trim() ?? '';
  const password = process.env.PLATFORM_BOOTSTRAP_PASSWORD ?? '';

  if (!email || !password) {
    console.error(
      'Missing PLATFORM_BOOTSTRAP_EMAIL and/or PLATFORM_BOOTSTRAP_PASSWORD. ' +
        'Supply both via environment or secret manager. Do not commit credentials.',
    );
    process.exitCode = 1;
    return;
  }

  await connectMongo();
  try {
    const result = await bootstrapPlatformAdmin({ email, password });
    if (result.status === 'already_exists') {
      console.log(result.message);
      return;
    }
    console.log(`Platform admin created successfully (${result.email}).`);
  } finally {
    await disconnectMongo();
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : 'Bootstrap failed';
  console.error(message);
  process.exitCode = 1;
  void disconnectMongo();
});
