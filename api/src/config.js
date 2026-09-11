import 'dotenv/config';

const toInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toFloat = (value, fallback) => {
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const config = {
  env: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 3000),
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  upload: {
    maxFileSizeBytes:
      toInt(process.env.MAX_FILE_SIZE_MB, 8) * 1024 * 1024,
    acceptedMimeTypes: [
      'image/png',
      'image/jpeg',
      'image/bmp',
      'image/tiff',
    ],
  },
  aiService: {
    baseUrl: (process.env.AI_SERVICE_URL || 'http://localhost:8000').replace(/\/+$/, ''),
    timeoutMs: toInt(process.env.AI_SERVICE_TIMEOUT_MS, 60000),
  },
};

export default config;