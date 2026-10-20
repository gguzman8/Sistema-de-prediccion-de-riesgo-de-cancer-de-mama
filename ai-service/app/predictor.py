import joblib
import pandas as pd

from .config import settings
from .features import CLASS_EN, CLASS_ES, FEATURE_ORDER, encode_bg


class PredictorError(Exception):
    pass


class Predictor:
    """Carga el modelo de metadatos MIAS y ejecuta la prediccion.

    Espera en `models/model.pkl` el pipeline de inferencia exportado por
    `python -m training.train_model` (SimpleImputer + RandomForest). Las
    clases internas del modelo son espanol (NORMAL/BENIGNO/MALIGNO) y se
    traducen al ingles para mantener el contrato de la API.
    """

    def __init__(self) -> None:
        self.model = None

    # ------------------------------------------------------------------ carga
    def load(self) -> None:
        if not settings.model_path.exists():
            raise PredictorError(
                f"No se encontro el modelo en {settings.model_path}. "
                "Ejecuta 'python -m training.train_model' o reemplaza models/model.pkl."
            )
        self.model = joblib.load(settings.model_path)

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
        return [CLASS_EN[c] for c in self.model.classes_]

    @property
    def malignant_index(self) -> int:
        matches = [i for i, c in enumerate(self.model.classes_) if c == "MALIGNO"]
        if len(matches) == 0:
            raise PredictorError("La clase 'MALIGNO' no existe en el modelo.")
        return matches[0]

    # ------------------------------------------------------------- clasificacion
    def classify_risk(self, prob_malignidad: float) -> str:
        """Replica la funcion classify_risk del notebook."""
        if prob_malignidad >= settings.umbral_alto_riesgo:
            return "ALTO RIESGO"
        if prob_malignidad >= settings.umbral_riesgo_medio:
            return "RIESGO MEDIO"
        if prob_malignidad >= settings.umbral_bajo_riesgo:
            return "BAJO RIESGO"
        return "RIESGO MUY BAJO"

    # ----------------------------------------------------------------- prediccion
    def predict(self, image_bytes: bytes, x: float, y: float, radius: float, bg_type: str) -> dict:
        self._ensure_loaded()

        bg_f, bg_g = encode_bg(bg_type)
        row = [x, y, radius, bg_f, bg_g]
        instance_df = pd.DataFrame([row], columns=FEATURE_ORDER)

        probas = self.model.predict_proba(instance_df)[0].astype(float)
        pred = str(self.model.predict(instance_df)[0])

        class_order = [str(c) for c in self.model.classes_]
        probabilities = {
            CLASS_EN[cls]: float(prob)
            for cls, prob in zip(class_order, probas)
        }

        prob_malignidad = float(probas[self.malignant_index])

        return {
            "predicted_class": CLASS_EN[pred],
            "probabilities": probabilities,
            "malignancy_probability": round(prob_malignidad, 6),
            "risk_level": self.classify_risk(prob_malignidad),
        }