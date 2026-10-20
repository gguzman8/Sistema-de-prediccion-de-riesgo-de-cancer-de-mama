import app from './app.js';
import config from './config.js';
import logger from './utils/logger.js';

app.listen(config.port, () => {
  logger.info('API de clasificacion de mamografias iniciada', {
    port: config.port,
    env: config.env,
    aiServiceUrl: config.aiService.baseUrl,
  });
});
