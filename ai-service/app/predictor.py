import math
from io import BytesIO

from PIL import Image, UnidentifiedImageError

from .config import settings

EXPECTED_CLASSES = ("Normal", "Benign", "Malignant")
CLASS_BY_NORMALIZED_NAME = {name.lower(): name for name in EXPECTED_CLASSES}


class PredictorError(Exception):
    pass


class InvalidImageError(PredictorError):
    pass


class Predictor:
    """Carga un clasificador YOLO y ejecuta inferencia sobre la imagen."""

    def __init__(self) -> None:
        self.model = None
        self._classes_by_index: dict[int, str] = {}

    def load(self) -> None:
        if not settings.model_path.exists():
            raise PredictorError(
                f"No se encontro el modelo en {settings.model_path}. "
                "Coloca un best.pt entrenado con Normal, Benign y Malignant."
            )

        try:
            from ultralytics import YOLO

            model = YOLO(str(settings.model_path))
            classes_by_index = self._normalize_classes(model.names)
        except PredictorError:
            raise
        except Exception as exc:
            raise PredictorError(f"No se pudo cargar el modelo YOLO: {exc}") from exc

        self.model = model
        self._classes_by_index = classes_by_index

    @staticmethod
    def _normalize_classes(names) -> dict[int, str]:
        if isinstance(names, dict):
            indexed_names = names.items()
        elif isinstance(names, (list, tuple)):
            indexed_names = enumerate(names)
        else:
            raise PredictorError("El modelo YOLO no expone un mapa de clases valido.")

        normalized = {}
        for index, raw_name in indexed_names:
            canonical = CLASS_BY_NORMALIZED_NAME.get(str(raw_name).strip().lower())
            if canonical is None:
                raise PredictorError(
                    "El modelo debe contener exactamente las clases Normal, Benign y Malignant."
                )
            normalized[int(index)] = canonical

        if set(normalized.values()) != set(EXPECTED_CLASSES) or len(normalized) != 3:
            raise PredictorError(
                "El modelo debe contener exactamente las clases Normal, Benign y Malignant."
            )
        if set(normalized) != set(range(len(normalized))):
            raise PredictorError("Los indices de clases del modelo YOLO no son consecutivos.")
        return normalized

    def _ensure_loaded(self) -> None:
        if self.model is None:
            self.load()

    @property
    def is_loaded(self) -> bool:
        return self.model is not None

    @property
    def classes(self) -> list[str]:
        if not self.is_loaded:
            return []
        return list(EXPECTED_CLASSES)

    def classify_risk(self, prob_malignidad: float) -> str:
        if prob_malignidad >= settings.umbral_alto_riesgo:
            return "ALTO RIESGO"
        if prob_malignidad >= settings.umbral_riesgo_medio:
            return "RIESGO MEDIO"
        if prob_malignidad >= settings.umbral_bajo_riesgo:
            return "BAJO RIESGO"
        return "RIESGO MUY BAJO"

    def predict(self, image_bytes: bytes) -> dict:
        self._ensure_loaded()

        try:
            with Image.open(BytesIO(image_bytes)) as source:
                source.verify()
            with Image.open(BytesIO(image_bytes)) as source:
                image = source.convert("RGB")
        except (UnidentifiedImageError, OSError, ValueError) as exc:
            raise InvalidImageError("El archivo no contiene una imagen valida.") from exc

        try:
            results = self.model.predict(source=image, verbose=False)
        except Exception as exc:
            raise PredictorError(f"La inferencia del modelo fallo: {exc}") from exc

        if len(results) != 1 or results[0].probs is None:
            raise PredictorError("El modelo no devolvio probabilidades de clasificacion.")

        probas = [float(value) for value in results[0].probs.data.cpu().tolist()]
        if len(probas) != len(self._classes_by_index):
            raise PredictorError("La salida del modelo no coincide con sus clases.")
        if any(not math.isfinite(value) or value < 0 for value in probas):
            raise PredictorError("El modelo devolvio probabilidades invalidas.")

        total = sum(probas)
        if total <= 0:
            raise PredictorError("El modelo devolvio probabilidades invalidas.")

        by_class = {
            self._classes_by_index[index]: probability / total
            for index, probability in enumerate(probas)
        }
        probabilities = {
            name: round(by_class[name], 6)
            for name in EXPECTED_CLASSES
        }
        predicted_class = max(by_class, key=by_class.get)
        prob_malignidad = by_class["Malignant"]

        return {
            "predicted_class": predicted_class,
            "probabilities": probabilities,
            "malignancy_probability": round(prob_malignidad, 6),
            "risk_level": self.classify_risk(prob_malignidad),
        }
