import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, Form, HTTPException, UploadFile

from .config import settings
from .predictor import Predictor, PredictorError
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
    title="Servicio de IA - Mamografias MIAS",
    description="Clasifica mamografias (Normal / Benign / Malignant) y asigna nivel de riesgo.",
    version="1.0.0",
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
    x: float = Form(...),
    y: float = Form(...),
    radius: float = Form(...),
    bg_type: str = Form(...),
) -> PredictionResponse:
    if not predictor.is_loaded:
        try:
            predictor.load()
        except PredictorError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc

    bg_type = bg_type.strip().upper()
    if bg_type not in ("D", "F", "G"):
        raise HTTPException(
            status_code=422,
            detail="El campo bg_type debe ser 'D', 'F' o 'G'.",
        )

    if x < 0 or y < 0 or radius < 0:
        raise HTTPException(
            status_code=422,
            detail="x, y y radius no pueden ser negativos.",
        )

    image_bytes = await image.read()
    if not image_bytes:
        raise HTTPException(status_code=422, detail="La imagen esta vacia.")

    try:
        return PredictionResponse(**predictor.predict(image_bytes, x, y, radius, bg_type))
    except PredictorError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc