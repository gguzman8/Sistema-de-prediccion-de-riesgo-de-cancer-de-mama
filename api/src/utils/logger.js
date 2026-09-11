const LEVELS = ['debug', 'info', 'warn', 'error'];

const currentLevel = LEVELS.indexOf(process.env.LOG_LEVEL || 'info');

const log = (level, message, meta) => {
  if (LEVELS.indexOf(level) < currentLevel) return;
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };
  if (meta) entry.meta = meta;
  if (level === 'error') console.error(JSON.stringify(entry));
  else console.log(JSON.stringify(entry));
};

export default {
  debug: (message, meta) => log('debug', message, meta),
  info: (message, meta) => log('info', message, meta),
  warn: (message, meta) => log('warn', message, meta),
  error: (message, meta) => log('error', message, meta),
};