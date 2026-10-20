import logger from './logger.js';

/**
 * Cliente HTTP minimalista sobre fetch con timeout y manejo de errores.
 */
export class HttpError extends Error {
  constructor(message, { status, responseBody } = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export async function request(url, { method = 'GET', body, headers = {}, timeoutMs = 60000 } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method,
      body,
      headers,
      signal: controller.signal,
    });

    const raw = await response.text();
    const contentLength = response.headers.get('content-type') || '';

    let data = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        data = raw;
      }
    }

    if (!response.ok) {
      throw new HttpError(
        `El servicio de IA respondio con estado ${response.status}`,
        { status: response.status, responseBody: data },
      );
    }

    if (!contentLength.includes('application/json') && typeof data !== 'object') {
      throw new HttpError('El servicio de IA devolvio una respuesta inesperada', {
        status: response.status,
        responseBody: data,
      });
    }

    return { status: response.status, data };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new HttpError(`Tiempo de espera agotado (${timeoutMs}ms)`, { status: 504 });
    }
    if (error instanceof HttpError) throw error;
    throw new HttpError(`No se pudo conectar con el servicio de IA: ${error.message}`, {
      status: 503,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function healthCheck(baseUrl, { timeoutMs = 3000 } = {}) {
  try {
    const { status, data } = await request(`${baseUrl}/health`, {
      timeoutMs,
      headers: { Accept: 'application/json' },
    });
    return {
      status: data?.model_loaded === false ? 'model_unavailable' : 'ok',
      code: status,
      modelLoaded: data?.model_loaded ?? null,
      classes: data?.classes ?? null,
    };
  } catch (error) {
    logger.warn('Health check del servicio de IA fallo', {
      error: error.message,
      status: error.status,
    });
    return { status: 'unavailable', code: error.status || null };
  }
}
