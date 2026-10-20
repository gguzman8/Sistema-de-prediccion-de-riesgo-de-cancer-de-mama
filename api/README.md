# API de Clasificacion de Mamografias

API publica Node.js/Express. Valida la subida y reenvia la imagen al servicio
FastAPI de YOLOv8 sin almacenar el archivo.

## Ejecucion

```bash
cd api
npm install
cp .env.example .env
npm run dev
```

## Endpoints

### `GET /health`

Devuelve el estado de Node y la disponibilidad del servicio de IA.

### `POST /api/v1/predictions`

Recibe `multipart/form-data` con el campo obligatorio `image`. Formatos
permitidos: PNG, JPEG, BMP y TIFF. Limite predeterminado: 8 MB.

```bash
curl -X POST http://localhost:3000/api/v1/predictions \
  -F image=@mamografia.png
```

Respuesta:

```json
{
  "id": "e18a9024-0cb3-4899-9448-bc52e072aefe",
  "createdAt": "2026-09-11T00:00:00.000Z",
  "input": {
    "filename": "mamografia.png",
    "mimeType": "image/png",
    "sizeBytes": 245760
  },
  "result": {
    "predicted_class": "Benign",
    "probabilities": { "Normal": 0.1, "Benign": 0.7, "Malignant": 0.2 },
    "malignancy_probability": 0.2,
    "risk_level": "BAJO RIESGO"
  },
  "aiServiceStatus": 200
}
```

La comunicacion interna usa `POST /predict` con el mismo campo `image`. Los
errores del servicio de IA se traducen a `AI_SERVICE_UNAVAILABLE`,
`AI_SERVICE_TIMEOUT` o `AI_SERVICE_ERROR`.
