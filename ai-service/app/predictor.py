import joblib
import numpy as np
import pandas as pd

from .config import settings
from .features import FEATURE_ORDER, extract_image_features, preprocess_image


class PredictorError(Exception):
    pass


class Predictor:
    """Carga el modelo entrenado y el LabelEncoder, y ejecuta la prediccion.

    Espera en `models/` los archivos generados en Google Colab:
      - model.pkl             Pipeline estandar (StandardScaler + RandomForest)
      - label_encoder.pkl     LabelEncoder ajustado sobre y_train
    """

    def __init__(self) -> None:
        self.model = None
        self.label_encoder = None

    # ------------------------------------------------------------------ carga
    def load(self) -> None:
        if not settings.model_path.exists():
            raise PredictorError(
                f"No se encontro el modelo en {settings.model_path}. "
                "Entrena el modelo en Colab y coloca 'model.pkl' en la carpeta models/."
            )
        if not settings.label_encoder_path.exists():
            raise PredictorError(
                f"No se encontro el LabelEncoder en {settings.label_encoder_path}. "
                "Entrena el modelo en Colab y coloca 'label_encoder.pkl' en la carpeta models/."
            )
        self.model = joblib.load(settings.model_path)
        self.label_encoder = joblib.load(settings.label_encoder_path)

    def _ensure_loaded(self) -> None:
        if self.model is None or self.label_encoder is None:
            self.load()

    @property
    def is_loaded(self) -> bool:
        return self.model is not None and self.label_encoder is not None

    @property
    def classes(self) -> list[str]:
        if not self.is_loaded:
            return []
        raw_classes = np.asarray(self.model.classes_)
        if np.issubdtype(raw_classes.dtype, np.number):
            return list(self.label_encoder.classes_)
        return [str(c) for c in raw_classes]

    @property
    def malignant_index(self) -> int:
        matches = np.where(self.label_encoder.classes_ == "Malignant")[0]
        if len(matches) == 0:
            raise PredictorError("La clase 'Malignant' no existe en el LabelEncoder.")
        return int(matches[0])

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

        img_array = preprocess_image(image_bytes)
        if img_array is None:
            raise PredictorError("No se pudo procesar la imagen subida.")

        image_features = extract_image_features(img_array)

        bgs = {"D": 0, "F": 0, "G": 0}
        bgs[bg_type] = 1

        has_lesion = 1 if (x != 0 or y != 0 or radius != 0) else 0
        row = [x, y, radius] + list(image_features) + [has_lesion, bgs["D"], bgs["F"], bgs["G"]]

        instance_df = pd.DataFrame([row], columns=FEATURE_ORDER)

        probas = self.model.predict_proba(instance_df)[0].astype(float)
        pred_encoded = int(self.model.predict(instance_df)[0])

        raw_classes = np.asarray(self.model.classes_)
        if np.issubdtype(raw_classes.dtype, np.number):
            predicted_class = str(self.label_encoder.inverse_transform([pred_encoded])[0])
            probability_classes = [str(c) for c in self.label_encoder.classes_]
        else:
            predicted_class = str(raw_classes[pred_encoded])
            probability_classes = [str(c) for c in raw_classes]

        probabilities = {
            cls: float(prob)
            for cls, prob in zip(probability_classes, probas)
        }

        prob_malignidad = float(probas[self.malignant_index])

        return {
            "predicted_class": predicted_class,
            "probabilities": probabilities,
            "malignancy_probability": round(prob_malignidad, 6),
            "risk_level": self.classify_risk(prob_malignidad),
        }