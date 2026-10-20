function resolveBaseUrl() {
  const configured = import.meta.env.VITE_API_URL;
  if (configured) {
    return configured.replace(/\/+$/, '');
  }
  return '';
}

export const API_BASE_URL = `${resolveBaseUrl()}/api/v1`;

export const PREDICTIONS_ENDPOINT = `${API_BASE_URL}/predictions`;

export async function predictMammogram(formData, timeoutMs = 70000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(PREDICTIONS_ENDPOINT, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    throw new Error(
      'No se pudo conectar con la API. Verificá que el servicio Node.js esté activo en el puerto 3000.',
    );
  } finally {
    clearTimeout(timer);
  }

  const data = await response.json().catch(() => ({}));
  const apiMessage = data?.error?.message || data?.message;

  if (!response.ok) {
    let message = 'Ocurrió un error al procesar la mamografía.';
    if (response.status === 400) {
      message = apiMessage || 'Los datos enviados no son válidos. Revisá la imagen y los campos.';
    } else if (response.status === 503) {
      message = apiMessage || 'El servicio de inteligencia artificial no está disponible. Verificá que FastAPI esté activo en el puerto 8000.';
    } else if (response.status === 504) {
      message = apiMessage || 'El análisis tardó demasiado. Intentá nuevamente en unos segundos.';
    } else if (response.status === 502) {
      message = apiMessage || 'El servicio de inteligencia artificial respondió con un error interno.';
    } else if (response.status >= 500) {
      message = apiMessage || 'Error interno del servidor. Intentá nuevamente más tarde.';
    }
    throw new Error(message);
  }

  return data;
}