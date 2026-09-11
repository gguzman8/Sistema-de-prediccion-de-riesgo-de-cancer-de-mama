import config from '../config.js';
import { validatePredictionInput } from '../validators/predictionValidator.js';
import * as aiService from './aiService.js';

/**
 * Orquesta una prediccion: valida la entrada, reenvia la imagen al
 * servicio Python de IA y devuelve el resultado listo para el cliente.
 */
export async function runPrediction(file, body) {
  if (!file) {
    const error = new Error('Debe adjuntar una imagen en el campo "image".');
    error.validationError = true;
    throw error;
  }

  if (!config.upload.acceptedMimeTypes.includes(file.mimetype)) {
    const error = new Error(
      `Formato de imagen no soportado. Formatos permitidos: ${config.upload.acceptedMimeTypes.join(', ')}`,
    );
    error.validationError = true;
    throw error;
  }

  const metadata = validatePredictionInput(body);

  const { status, data } = await aiService.predict(file.buffer, {
    filename: file.originalname,
    mimeType: file.mimetype,
  }, metadata);

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    input: metadata,
    result: data,
    aiServiceStatus: status,
  };
}