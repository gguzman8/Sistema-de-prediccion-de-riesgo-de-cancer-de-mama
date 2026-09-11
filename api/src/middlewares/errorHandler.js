import { HttpError } from '../utils/httpClient.js';
import logger from '../utils/logger.js';

/**
 * Centraliza el manejo de errores de la API.
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Ruta '${req.method} ${req.originalUrl}' no encontrada.`,
    },
  });
}

export function errorHandler(error, req, res, next) {
  // Errores de Multer (límites de subida de archivos)
  if (error && error.name === 'MulterError') {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'El archivo supera el tamaño maximo permitido.'
        : `Error al procesar la subida del archivo: ${error.code}`;
    return res.status(400).json({ error: { code: 'UPLOAD_ERROR', message } });
  }

  if (error && error.validationError) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: error.message } });
  }

  if (error instanceof HttpError) {
    const status = error.status || 502;
    const code = error.status === 503 ? 'AI_SERVICE_UNAVAILABLE'
      : error.status === 504 ? 'AI_SERVICE_TIMEOUT'
      : 'AI_SERVICE_ERROR';
    return res.status(status).json({ error: { code, message: error.message } });
  }

  logger.error('Error no controlado', { error: error.message, stack: error.stack });
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Ocurrio un error interno del servidor.' },
  });
}