from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = Path(__file__).resolve().parent.parent / "models"


class Settings:
    model_path: Path = Path()
    umbral_alto_riesgo: float = 0.70
    umbral_riesgo_medio: float = 0.30
    umbral_bajo_riesgo: float = 0.10

    def __init__(self):
        import os

        self.model_path = Path(
            os.getenv("MODEL_PATH", str(MODELS_DIR / "model.pkl"))
        )
        self.umbral_alto_riesgo = float(os.getenv("UMBRAL_ALTO_RIESGO", "0.70"))
        self.umbral_riesgo_medio = float(os.getenv("UMBRAL_RIESGO_MEDIO", "0.30"))
        self.umbral_bajo_riesgo = float(os.getenv("UMBRAL_BAJO_RIESGO", "0.10"))


settings = Settings()