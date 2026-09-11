# Sistema de Prediccion de Mamografias (MIAS)

Tesis de clasificación de mamografías (Normal / Benign / Malignant) con Random Forest,
basada en el notebook de investigación `miasMammography.ipynb`.

## Arquitectura

```
Aplicacion externa ──> api/ (Node.js + Express)  ──>  ai-service/ (Python + FastAPI)
                            │                            │
                            └── recibe imagen+metadatos   └── extrae características (GLCM)
                            └── valida la entrada           └── predice con el modelo (RandomForest)
                            └── reenvía al servicio IA      └── calcula riesgo (umbrales de malignidad)
```

## Servicios

| Carpeta        | Tecnología   | Rol                                        | Puerto |
|----------------|--------------|--------------------------------------------|--------|
| `api/`         | Node/Express | API principal consumida por el cliente     | 3000   |
| `ai-service/`  | Python/FastAPI | Inferencia del modelo y extracción de features | 8000  |

## Ejecucion

```bash
# 1. Servicio Python de IA
cd ai-service
source .venv/bin/activate
uvicorn app.main:app --port 8000

# 2. API Node (otra terminal)
cd api
cp .env.example .env
npm install
npm run dev
```

Ver `api/README.md` (contrato de la API) y `ai-service/README.md` (modelo y endpoints internos).

## Estado del modelo

El modelo **real debe entrenarse en Google Colab** (los archivos `models/model.pkl`
y `models/label_encoder.pkl` se exportan como se indica en `ai-service/README.md`).
Actualmente hay un modelo placeholder para verificar el flujo completo.