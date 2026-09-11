const BG_TYPES = ['D', 'F', 'G'];

const isMissing = (value) => value === undefined || value === null || value === '';

function fail(message) {
  const error = new Error(message);
  error.validationError = true;
  return error;
}

const parseNumberField = (value, fieldName) => {
  if (isMissing(value)) {
    throw fail(`El campo '${fieldName}' es obligatorio.`);
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw fail(`El campo '${fieldName}' debe ser un numero valido.`);
  }
  if (number < 0) {
    throw fail(`El campo '${fieldName}' no puede ser negativo.`);
  }
  return number;
};

const validateBgType = (value) => {
  if (isMissing(value)) {
    throw fail("El campo 'bg_type' es obligatorio.");
  }
  const normalizado = String(value).trim().toUpperCase();
  if (!BG_TYPES.includes(normalizado)) {
    throw fail("El campo 'bg_type' debe ser 'D', 'F' o 'G'.");
  }
  return normalizado;
};

/**
 * Valida y normaliza la metadata de la mamografia que llega junto con la imagen.
 */
export function validatePredictionInput(body) {
  return {
    x: parseNumberField(body.x, 'x'),
    y: parseNumberField(body.y, 'y'),
    radius: parseNumberField(body.radius, 'radius'),
    bg_type: validateBgType(body.bg_type),
  };
}