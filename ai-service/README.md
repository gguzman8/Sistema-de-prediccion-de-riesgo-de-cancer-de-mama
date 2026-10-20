# Servicio de IA YOLOv8

Servicio interno FastAPI que clasifica directamente una imagen mamografica como
`Normal`, `Benign` o `Malignant` mediante Ultralytics YOLOv8 Classification.

## Instalacion

```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Pesos

La ruta predeterminada es `models/best.pt` y puede cambiarse con `MODEL_PATH`.
El archivo incluido contiene `normal`, `benign` y `malignant`; el orden interno
es indiferente. El servicio valida las clases antes de marcar el modelo como
cargado.

## Entrenamiento

```bash
pip install -r requirements-training.txt
python -m training.train_yolo
```

El script descarga `orvile/mias-dataset`, consolida anotaciones por estudio,
divide por paciente, balancea solo entrenamiento y selecciona el checkpoint por
F1 macro de validacion. Las metricas y matrices de confusion quedan en
`models/model_metadata.json`.

Sobre las 50 imagenes reservadas para prueba: accuracy `54.0%`, balanced accuracy
`45.8%`, F1 macro `45.8%` y recall maligno `37.5%`. Este rendimiento es
experimental y no constituye validacion clinica.

## Endpoints

### `GET /health`

Sin pesos validos:

```json
{ "status": "ok", "model_loaded": false, "classes": null }
```

Con pesos validos:

```json
{ "status": "ok", "model_loaded": true, "classes": ["Normal", "Benign", "Malignant"] }
```

### `POST /predict`

Recibe `multipart/form-data` con un unico campo obligatorio `image`. Formatos:
PNG, JPEG, BMP o TIFF. El limite predeterminado es 8 MB.

```json
{
  "predicted_class": "Benign",
  "probabilities": { "Normal": 0.11, "Benign": 0.77, "Malignant": 0.12 },
  "malignancy_probability": 0.12,
  "risk_level": "BAJO RIESGO"
}
```

El riesgo se calcula con la probabilidad `Malignant`: alto desde 0.70, medio
desde 0.30, bajo desde 0.10 y muy bajo por debajo de 0.10. Los umbrales y el
limite de archivo se configuran mediante las variables de `.env.example`.

## Estructura

```text
ai-service/
├── app/
│   ├── config.py
│   ├── main.py
│   ├── predictor.py
│   └── schemas.py
├── models/
│   ├── best.pt
│   └── model_metadata.json
├── training/train_yolo.py
├── requirements.txt
└── requirements-training.txt
```
