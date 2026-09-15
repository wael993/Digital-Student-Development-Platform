function pick(vars: NodeJS.Dict<string>, ...names: string[]): string {
  for (const name of names) {
    const value = vars[name]?.trim();
    if (value) {
      return value;
    }
  }
  return '';
}

export function buildMongoUri(vars: NodeJS.Dict<string>): string {
  const explicit = pick(vars, 'MONGODB_URI');
  if (explicit) {
    return explicit;
  }

  const host = pick(vars, 'MONGODB_HOST');
  const database = pick(vars, 'MONGODB_DATABASE', 'BUSINESS_PLATFORM_MONGO_DB_DATABASE_NAME');
  const username = pick(vars, 'MONGODB_USERNAME', 'BUSINESS_PLATFORM_MONGO_DB_USERNAME');
  const password = pick(vars, 'MONGODB_PASSWORD', 'BUSINESS_PLATFORM_MONGO_DB_PASSWORD');

  if (!host || !database) {
    throw new Error(
      'Missing MongoDB config: set MONGODB_URI or MONGODB_HOST + MONGODB_DATABASE (username/password optional for local)',
    );
  }

  const protocol = host.includes('mongodb.net') ? 'mongodb+srv' : 'mongodb';
  const auth = username
    ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@`
    : '';
  const query = protocol === 'mongodb+srv' ? '?appName=Cluster0' : '';
  return `${protocol}://${auth}${host}/${database}${query}`;
}

export function buildRedisUrl(vars: NodeJS.Dict<string>): string {
  if (vars.REDIS_URL !== undefined) {
    return vars.REDIS_URL.trim();
  }

  const host = pick(vars, 'REDIS_HOST');
  if (!host) {
    return '';
  }

  const port = pick(vars, 'REDIS_PORT') || '6379';
  const username = pick(vars, 'REDIS_USERNAME');
  const password = pick(vars, 'REDIS_PASSWORD');
  if (!password) {
    return `redis://${host}:${port}`;
  }

  const user = encodeURIComponent(username || 'default');
  return `redis://${user}:${encodeURIComponent(password)}@${host}:${port}`;
}
