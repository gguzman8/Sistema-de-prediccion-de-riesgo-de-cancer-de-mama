import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile

from .config import settings
from .predictor import InvalidImageError, Predictor, PredictorError
from .schemas import HealthResponse, PredictionResponse

logger = logging.getLogger("ai-service")
logging.basicConfig(level=logging.INFO)

predictor = Predictor()


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        predictor.load()
        logger.info("Modelo cargado correctamente desde %s", settings.model_path)
    except PredictorError as exc:
        logger.warning("%s", exc)
    yield


app = FastAPI(
    title="Servicio de IA - Clasificacion de mamografias",
    description="Clasifica imagenes con YOLOv8 (Normal / Benign / Malignant) y asigna nivel de riesgo.",
    version="2.0.0",
    lifespan=lifespan,
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        model_loaded=predictor.is_loaded,
        classes=predictor.classes if predictor.is_loaded else None,
    )


@app.post("/predict", response_model=PredictionResponse)
async def predict(
    image: UploadFile = File(...),
) -> PredictionResponse:
    if not predictor.is_loaded:
        try:
            predictor.load()
        except PredictorError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc

    if image.content_type not in {"image/png", "image/jpeg", "image/bmp", "image/tiff"}:
        raise HTTPException(
            status_code=415,
            detail="Formato no soportado. Usa PNG, JPEG, BMP o TIFF.",
        )

    image_bytes = await image.read(settings.max_file_size_bytes + 1)
    if not image_bytes:
        raise HTTPException(status_code=422, detail="La imagen esta vacia.")
    if len(image_bytes) > settings.max_file_size_bytes:
        raise HTTPException(status_code=413, detail="La imagen supera el tamano maximo permitido.")

    try:
        return PredictionResponse(**predictor.predict(image_bytes))
    except InvalidImageError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except PredictorError as exc:
        logger.exception("La inferencia YOLO fallo")
        raise HTTPException(status_code=500, detail=str(exc)) from exc
