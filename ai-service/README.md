# Servicio de IA - Prediccion de Mamografias (MIAS)

Backend en **Python / FastAPI** que clasifica la severidad con un Random Forest
entrenado sobre los **metadatos de la lesion** del dataset MIAS. El modelo NO
analiza los pixeles de la mamografia: predice a partir de la ubicacion, el
tamano de la anomalia y la densidad glandular. Node.js lo consume reenviandole
imagen y metadatos.

## Requisitos

- Python >= 3.10

## Instalacion y ejecucion

```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Modelo

El servicio carga `models/model.pkl`: un pipeline de scikit-learn
(`SimpleImputer` + `RandomForestClassifier`) entrenado y exportado por el
flujo reproducible en `training/train_model.py`.

Para reentrenar (descarga el dataset MIAS automaticamente):

```bash
pip install -r requirements-training.txt
python -m training.train_model
```

El script corrige las inconsistencias de `modeloChecar.ipynb`, consolida
imagenes con varias lesiones (conserva la de mayor severidad), selecciona los
hiperparametros priorizando la sensibilidad de `MALIGNO` y evalúa el test una
sola vez. Los resultados quedan en `models/model_metadata.json` y
`training/outputs/test_metrics.json`.

## Endpoints

### `GET /health`

```json
{ "status": "ok", "model_loaded": true, "classes": ["Benign", "Malignant", "Normal"] }
```

### `POST /predict`

Formato `multipart/form-data`:

| Campo     | Tipo    | Descripción                                      |
|-----------|---------|--------------------------------------------------|
| `image`   | archivo | Mamografía PNG/JPEG (se conserva como registro)  |
| `x`       | float   | Coordenada X de la lesión (0 si no hay lesión)  |
| `y`       | float   | Coordenada Y de la lesión (0 si no hay lesión)  |
| `radius`  | float   | Radio de la lesión (0 si no hay lesión)         |
| `bg_type` | string  | Tejido mamario: `D`, `F` o `G`                  |

**Respuesta 200:**

```json
{
  "predicted_class": "Benign",
  "probabilities": { "Normal": 0.11, "Benign": 0.77, "Malignant": 0.12 },
  "malignancy_probability": 0.12,
  "risk_level": "BAJO RIESGO"
}
```

`risk_level` se calcula con los umbrales originales del notebook:
>= 0.70 `ALTO RIESGO`, >= 0.30 `RIESGO MEDIO`, >= 0.10 `BAJO RIESGO`,
en otro caso `RIESGO MUY BAJO` (configurables por entorno, ver `app/config.py`).

## Estructura

```
ai-service/
├── app/
│   ├── main.py                        # FastAPI: /health y /predict
│   ├── config.py                      # Ruta del modelo y umbrales
│   ├── features.py                    # Caracteristicas (X, Y, RADIUS, BG) y clases
│   ├── predictor.py                   # Carga del modelo y prediccion
│   ├── schemas.py                     # Modelos de respuesta Pydantic
│   └── generate_placeholder_model.py  # Modelo de prueba (NO usar en produccion)
├── training/
│   ├── train_model.py                 # Entrenamiento reproducible + export
│   └── outputs/                       # Metricas del conjunto de prueba
├── models/                            # model.pkl + model_metadata.json
├── requirements.txt                   # Dependencias de inferencia
└── requirements-training.txt          # Dependencias de entrenamiento
```