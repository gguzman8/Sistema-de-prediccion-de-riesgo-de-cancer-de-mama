# Sistema de Prediccion de Mamografias (MIAS)

Tesis de clasificación de mamografías (Normal / Benign / Malignant) con Random Forest
en entrenamiento; **inferencia basada en metadatos de la lesión** del dataset MIAS
(X, Y, RADIUS y densidad glandular), no en los píxeles de la imagen. Incluye el
frontend **React** construido a partir del prototipo del sistema.

## Arquitectura

```
Cliente (React)  ──>  api/ (Node.js + Express)  ──>  ai-service/ (Python + FastAPI)
                             │                            │
                             └── recibe imagen+metadatos   └── predice con el modelo (RandomForest)
                             └── valida la entrada           └── inputs: X, Y, RADIUS, BG (D/F/G)
                             └── reenvía al servicio IA      └── calcula riesgo (umbrales de malignidad)
```

## Servicios

| Carpeta           | Tecnología            | Rol                                                        | Puerto |
|-------------------|-----------------------|------------------------------------------------------------|--------|
| raíz (frontend)   | React + JS + Vite     | Interfaz del prototipo (Dashboard, Mamografías, Pacientes) | 5173   |
| `api/`            | Node/Express          | API principal consumida por el cliente                     | 3000   |
| `ai-service/`     | Python/FastAPI        | Inferencia del modelo (metadatos MIAS)                     | 8000   |

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

# 3. Frontend React (otra terminal, en la raíz del proyecto)
npm install
npm run dev          # http://localhost:5173
```

Durante el desarrollo, Vite redirige `/api` a la API de Node (puerto 3000). Si se
compila para producción y el frontend se sirve desde otro origen, definir
`VITE_API_URL` a la URL de la API antes de `npm run build` (ver `.env.example`).

Ver `api/README.md` (contrato de la API) y `ai-service/README.md` (modelo y endpoints internos).

## Frontend (React)

Replica el prototipo del sistema. Pantallas: **Dashboard** (cola de revisión y caso
destacado), **Mamografías** (búsqueda, filtros, orden, guardadas y paginación),
**Pacientes** (listado, registro y detalle), **Configuración**, **Revisión** (carga
de imagen + parámetros) y **Resultado** (clase, probabilidades y nivel de riesgo).

- Los pacientes, mamografías y estudios guardados son datos simulados en el navegador
  (se pierden al recargar la página).
- La única operación conectada al backend es la **predicción**: la pantalla de
  revisión envía `multipart/form-data` a `POST /api/v1/predictions`.
- Diseño responsivo (escritorio/tablet/móvil) con menú lateral colapsable.

Estructura:

```
src/
├── main.jsx / App.jsx        # Punto de entrada y rutas
├── index.css                 # Tokens de diseño y estilos (CSS puro)
├── components/               # Sidebar, Header, tarjetas, paginación, modales, iconos
├── context/DataContext.jsx   # Datos simulados (pacientes, mamografías, guardados)
├── pages/                    # Dashboard, Mamografías, Pacientes, Detalle, Revisión, Resultado, Configuración
├── services/api.js           # Cliente HTTP hacia la API de predicción
└── utils/formatters.js       # Formato de fechas, riesgo y probabilidades
```

## Estado del modelo

El modelo fue entrenado con el dataset **MIAS** (`orvile/mias-dataset`) mediante el
flujo reproducible `ai-service/training/train_model.py`, que descarga el dataset,
consolida imágenes duplicadas (conserva la lesión de mayor severidad), selecciona
hiperparámetros priorizando la sensibilidad de `MALIGNO` y evalúa el conjunto de
prueba una sola vez. Resultado exportado en `ai-service/models/model.pkl`.

Métricas sobre el conjunto de prueba (65 estudios: 42 NORMAL, 13 BENIGNO, 10 MALIGNO):

| Métrica                        | Valor  |
|--------------------------------|--------|
| Accuracy                       | 83.08 % |
| Balanced accuracy              | 67.18 % |
| F1 macro                       | 67.12 % |
| ROC-AUC macro                  | 92.26 % |
| Recall / Precisión MALIGNO     | 40 % / 44.44 % |
| Recall NORMAL                  | 100 %  |

Detalle completo en `ai-service/models/model_metadata.json` y
`ai-service/training/outputs/test_metrics.json`. La imagen se conserva como registro
clínico, pero la predicción usa únicamente los metadatos de la lesión.