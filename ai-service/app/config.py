from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = Path(__file__).resolve().parent.parent / "models"
load_dotenv(BASE_DIR / ".env")


class Settings:
    model_path: Path = Path()
    max_file_size_bytes: int = 8 * 1024 * 1024
    umbral_alto_riesgo: float = 0.70
    umbral_riesgo_medio: float = 0.30
    umbral_bajo_riesgo: float = 0.10

    def __init__(self):
        import os

        model_path = Path(os.getenv("MODEL_PATH", str(MODELS_DIR / "best.pt")))
        self.model_path = model_path if model_path.is_absolute() else BASE_DIR / model_path
        self.max_file_size_bytes = int(os.getenv("MAX_FILE_SIZE_MB", "8")) * 1024 * 1024
        self.umbral_alto_riesgo = float(os.getenv("UMBRAL_ALTO_RIESGO", "0.70"))
        self.umbral_riesgo_medio = float(os.getenv("UMBRAL_RIESGO_MEDIO", "0.30"))
        self.umbral_bajo_riesgo = float(os.getenv("UMBRAL_BAJO_RIESGO", "0.10"))


settings = Settings()
