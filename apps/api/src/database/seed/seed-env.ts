const ALLOWED = new Set(['development', 'test']);

export function assertSeedEnvironment(nodeEnv = process.env.NODE_ENV ?? 'development'): void {
  if (!ALLOWED.has(nodeEnv)) {
    throw new Error(
      `Refusing to seed when NODE_ENV=${nodeEnv}. Seed and seed:reset are allowed only in development and test.`,
    );
  }
}
