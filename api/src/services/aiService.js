import config from '../config.js';
import { request, healthCheck } from '../utils/httpClient.js';

const AI_PREDICT_PATH = '/predict';

/**
 * Contrato con el servicio Python de IA:
 *
 * Request:  multipart/form-data
 *   - image:  archivo de imagen (PNG/JPEG/BMP/TIFF)
 *
 * Response (200):
 *   {
 *     "predicted_class": "Benign",
 *     "probabilities": { "Normal": 0.1, "Benign": 0.7, "Malignant": 0.2 },
 *     "malignancy_probability": 0.2,
 *     "risk_level": "BAJO RIESGO"
 *   }
 */

/**
 * Envia una prediccion al servicio Python de IA.
 *
 * @param {Buffer} imageBuffer - Bytes de la imagen.
 * @param {{ filename: string, mimeType: string }} file - Informacion del archivo.
 */
export async function predict(imageBuffer, file) {
  const formData = new FormData();

  const blob = new Blob([imageBuffer], { type: file.mimeType });
  formData.append('image', blob, file.filename);

  const url = `${config.aiService.baseUrl}${AI_PREDICT_PATH}`;
  const { status, data } = await request(url, {
    method: 'POST',
    body: formData,
    // No se define Content-Type: el limite multipart lo genera el propio FormData.
    timeoutMs: config.aiService.timeoutMs,
  });

  return { status, data };
}

export async function checkAiHealth() {
  return healthCheck(config.aiService.baseUrl);
}
