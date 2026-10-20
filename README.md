# Sistema de Clasificacion de Mamografias

Aplicacion de tesis para clasificar imagenes mamograficas como `Normal`, `Benign`
o `Malignant` con un clasificador YOLOv8. La imagen es la unica entrada del modelo;
no se solicitan coordenadas, radio de lesion ni densidad glandular.

El modelo entrenado se encuentra en `ai-service/models/best.pt`.

## Arquitectura

```text
React :5173 -> Node.js/Express :3000 -> Python/FastAPI + YOLOv8 :8000
```

| Carpeta | Tecnologia | Rol |
|---|---|---|
| raiz | React + Vite | Interfaz, carga de imagen y resultados |
| `api/` | Node.js + Express | Validacion de subida y API publica |
| `ai-service/` | Python + FastAPI | Decodificacion e inferencia YOLOv8 |

## Ejecucion

```bash
# 1. Servicio de IA
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --port 8000

# 2. API Node, en otra terminal
cd api
cp .env.example .env
npm install
npm run dev

# 3. Frontend, en otra terminal desde la raiz
npm install
npm run dev
```

Vite redirige `/api` a Node durante desarrollo. En produccion se puede definir
`VITE_API_URL` antes de ejecutar `npm run build`.

## Modelo esperado

`best.pt` debe ser un modelo Ultralytics de clasificacion, no de deteccion, y
contener exactamente estas clases (sin distinguir mayusculas):

```text
normal
benign
malignant
```

El servicio rechaza modelos incompletos o con otras clases. El peso original de
`yolOriginal.ipynb` tenia solo la clase `benign`; fue sustituido por un modelo
entrenado con las imagenes y anotaciones de `orvile/mias-dataset`.

El entrenamiento reproducible esta en `ai-service/training/train_yolo.py`. Divide
por paciente, sobremuestrea solo el conjunto de entrenamiento y selecciona entre
los checkpoints `best` y `last` mediante F1 macro de validacion.

```bash
cd ai-service
source .venv/bin/activate
pip install -r requirements-training.txt
python -m training.train_yolo
```

Metricas del conjunto de prueba reservado (50 imagenes): accuracy `54.0%`,
balanced accuracy `45.8%`, F1 macro `45.8%` y recall maligno `37.5%`. Son
resultados experimentales de un dataset pequeno; el modelo sirve para la tesis y
el prototipo, pero no esta validado para uso clinico.

## Datos del prototipo

Pacientes, historial y mamografias de ejemplo se mantienen solo en memoria en el
navegador. La unica operacion conectada a los backends es la prediccion.

`modeloChecar.ipynb` y `miasMammography.ipynb` se conservan exclusivamente como
archivo historico de los modelos Random Forest retirados. No forman parte del
runtime ni del proceso de instalacion.

Consulta `api/README.md` y `ai-service/README.md` para los contratos HTTP.
