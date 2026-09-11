# Servicio de IA - Prediccion de Mamografias (MIAS)

Backend en **Python / FastAPI** que replica el pipeline del notebook de Colab
(`miasMammography.ipynb`): extrae características de la mamografía (estadísticas
globales + textura GLCM) y clasifica la severidad con el modelo Random Forest
entrenado. Node.js lo consume reenviándole imagen y metadatos.

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

El servicio carga dos archivos desde `models/`:

| Archivo            | Contenido                                                        |
|--------------------|------------------------------------------------------------------|
| `model.pkl`        | Pipeline de scikit-learn (StandardScaler + RandomForestClassifier) |
| `label_encoder.pkl`| `LabelEncoder` ajustado sobre `y_train`                          |

Exportalos desde Google Colab (al final del notebook):

```python
import joblib
joblib.dump(best_model, 'model.pkl')
joblib.dump(le, 'label_encoder.pkl')
from google.colab import files
files.download('model.pkl')
files.download('label_encoder.pkl')
```

Despues colocalos en `ai-service/models/`.

> **Estado actual:** hay un modelo de prueba (placeholder) generado con
> `python -m app.generate_placeholder_model` para verificar el flujo completo.
> Reemplazalo con el modelo real entrenado en Colab.

## Endpoints

### `GET /health`

```json
{ "status": "ok", "model_loaded": true, "classes": ["Benign", "Malignant", "Normal"] }
```

### `POST /predict`

Formato `multipart/form-data`:

| Campo     | Tipo    | Descripción                                      |
|-----------|---------|--------------------------------------------------|
| `image`   | archivo | Mamografía PNG/JPEG/BMP/TIFF                     |
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

## Replicacion del notebook

- `app/features.py` -> `preprocess_image` y `extract_image_features` (celda `d8a75a02`).
- `app/predictor.py` -> carga del modelo, `predict_proba`, `classify_risk` (funcion `predict_mammogram` y `classify_risk`).
- El orden exacto de las 17 características se conserva en `FEATURE_ORDER` para que
  coincida con el `X_train` del notebook.

## Estructura

```
ai-service/
├── app/
│   ├── main.py                        # FastAPI: /health y /predict
│   ├── config.py                      # Rutas del modelo y umbrales
│   ├── features.py                    # Preprocesamiento y extraccion de características
│   ├── predictor.py                   # Carga del modelo y prediccion
│   ├── schemas.py                     # Modelos de respuesta Pydantic
│   └── generate_placeholder_model.py  # Modelo de prueba (NO usar en produccion)
├── models/                            # model.pkl + label_encoder.pkl
└── requirements.txt
```