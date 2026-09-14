type LogMeta = unknown;

function write(level: 'info' | 'warn' | 'error', message: string, meta?: LogMeta): void {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...(meta === undefined ? {} : { meta }),
  };

  if (level === 'error') {
    console.error(JSON.stringify(entry));
    return;
  }

  if (level === 'warn') {
    console.warn(JSON.stringify(entry));
    return;
  }

  console.log(JSON.stringify(entry));
}

export const logger = {
  info: (message: string, meta?: LogMeta) => write('info', message, meta),
  warn: (message: string, meta?: LogMeta) => write('warn', message, meta),
  error: (message: string, meta?: LogMeta) => write('error', message, meta),
};
