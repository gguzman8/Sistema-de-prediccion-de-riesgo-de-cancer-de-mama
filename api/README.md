# API de Predicción de Mamografías (MIAS)

Backend escrito en **Node.js / Express** que expone la API consumida por la aplicación externa. Recibe la mamografía (imagen + metadatos) y la reenvía al **servicio Python de IA** (a integrar) para obtener la clasificación y el nivel de riesgo.

## Arquitectura

```
Aplicación externa ──> API Node.js (Express) ──> Servicio Python de IA (a integrar)
                          │
                          └── Valida imagen y metadatos
                          └── Reenvía al servicio de IA (HTTP multipart)
                          └── Normaliza y devuelve el resultado
```

## Requisitos

- Node.js >= 18.17 (probado con v24)

## Instalación y ejecución

```bash
cd api
npm install
cp .env.example .env   # ajustar variables si es necesario
npm run dev            # desarrollo (reinicio automático)
npm start              # producción
```

## Endpoints

### `GET /health`

Estado de la API y del servicio de IA.

```json
{
  "status": "ok",
  "uptime": 14.3,
  "timestamp": "2026-09-11T00:00:00.000Z",
  "aiService": { "status": "ok", "code": 200 }
}
```

### `POST /api/v1/predictions`

Predice la severidad de una mamografía.

**Formato:** `multipart/form-data`

| Campo      | Tipo    | Obligatorio | Descripción                                        |
|------------|---------|-------------|----------------------------------------------------|
| `image`    | archivo | sí          | Mamografía (PNG, JPEG, BMP, TIFF). Máx. 8 MB.     |
| `x`        | float   | sí          | Coordenada X de la lesión (0 si no hay lesión).   |
| `y`        | float   | sí          | Coordenada Y de la lesión (0 si no hay lesión).   |
| `radius`   | float   | sí          | Radio de la lesión (0 si no hay lesión).          |
| `bg_type`  | string  | sí          | Tejido mamario: `D`, `F` o `G`.                   |

**Respuesta 200:**

```json
{
  "id": "e18a9024-0cb3-4899-9448-bc52e072aefe",
  "createdAt": "2026-09-11T00:00:00.000Z",
  "input": { "x": 120, "y": 80, "radius": 15, "bg_type": "F" },
  "result": {
    "predicted_class": "Benign",
    "probabilities": { "Normal": 0.1, "Benign": 0.7, "Malignant": 0.2 },
    "malignancy_probability": 0.2,
    "risk_level": "BAJO RIESGO"
  },
  "aiServiceStatus": 200
}
```

**Niveles de riesgo** (según probabilidad de malignidad, definidos en el notebook):

| Nivel           | Probabilidad de malignidad |
|-----------------|----------------------------|
| ALTO RIESGO     | >= 0.70                    |
| RIESGO MEDIO    | >= 0.30 y < 0.70           |
| BAJO RIESGO     | >= 0.10 y < 0.30           |
| RIESGO MUY BAJO | < 0.10                     |

**Errores:**

| Código                    | HTTP | Descripción                                                |
|---------------------------|------|------------------------------------------------------------|
| `VALIDATION_ERROR`        | 400  | Imagen o campos inválidos.                                 |
| `UPLOAD_ERROR`            | 400  | Error de subida (tamaño, formato).                         |
| `AI_SERVICE_UNAVAILABLE`  | 503  | No se puede conectar con el servicio Python.               |
| `AI_SERVICE_TIMEOUT`      | 504  | El servicio Python tardó demasiado.                        |
| `AI_SERVICE_ERROR`        | 502  | El servicio Python respondió con error.                    |
| `NOT_FOUND`               | 404  | Ruta inexistente.                                          |
| `INTERNAL_ERROR`          | 500  | Error no controlado.                                       |

Ejemplo con `curl`:

```bash
curl -X POST http://localhost:3000/api/v1/predictions \
  -F image=@mamografia.png \
  -F x=120 \
  -F y=80 \
  -F radius=15 \
  -F bg_type=F
```

## Integración con el servicio Python

La variable `AI_SERVICE_URL` (`.env`) apunta al servicio Python. El contrato esperado es:

```
POST /predict        multipart/form-data  (image, x, y, radius, bg_type)
GET  /health
```

El servicio Python debe devolver en `POST /predict` JSON con:
`predicted_class`, `probabilities` (objeto por clase), `malignancy_probability` y `risk_level`.

Hasta que el servicio Python esté disponible, la API responde en `/api/v1/predictions` con `503 AI_SERVICE_UNAVAILABLE`.

## Estructura del proyecto

```
api/
├── src/
│   ├── server.js                 # Punto de entrada
│   ├── app.js                    # Configuración de Express
│   ├── config.js                 # Variables de entorno
│   ├── routes/                   # Definición de rutas
│   ├── controllers/              # Handlers HTTP
│   ├── services/
│   │   ├── aiService.js          # Cliente HTTP del servicio Python de IA
│   │   └── predictionService.js  # Orquestación de la predicción
│   ├── validators/               # Validación de entrada
│   ├── middlewares/              # Manejo de errores
│   └── utils/                    # Logger y cliente HTTP
└── .env.example
```