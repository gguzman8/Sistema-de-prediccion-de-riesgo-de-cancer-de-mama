"""Genera un modelo PLACEHOLDER para probar el servicio end-to-end.

IMPORTANTE: este modelo NO es el modelo real. Entrena un RandomForest con
datos sinteticos solo para que /predict funcione antes de integrar el modelo
entrenado en Google Colab.

Uso:
    python -m app.generate_placeholder_model

Salida:
    models/model.pkl            Pipeline (StandardScaler + RandomForest)
    models/label_encoder.pkl    LabelEncoder con clases Benign/Malignant/Normal

Reemplazo:
    Cuando tengas el modelo real de Colab, sobrescribe estos mismos archivos:
    - joblib.dump(best_model, 'models/model.pkl')
    - joblib.dump(le, 'models/label_encoder.pkl')
"""

import numpy as np
import pandas as pd
from joblib import dump
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, StandardScaler

from .features import FEATURE_ORDER

N_SAMPLES = 600
RANDOM_STATE = 42


def build_placeholder_model() -> None:
    rng = np.random.default_rng(RANDOM_STATE)

    y = np.array(["Normal"] * 380 + ["Benign"] * 120 + ["Malignant"] * 100)
    rng.shuffle(y)
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    X = pd.DataFrame(rng.normal(size=(N_SAMPLES, len(FEATURE_ORDER))), columns=FEATURE_ORDER)
    # Simular correlacion minima: lesiones con radio mayor tienden a ser malignas.
    X["RADIUS"] = np.where(y == "Malignant", np.abs(rng.normal(80, 20, N_SAMPLES)),
                           np.where(y == "Benign", np.abs(rng.normal(30, 15, N_SAMPLES)), 0.0))

    pipeline = Pipeline(
        steps=[
            ("preprocessor", StandardScaler()),
            ("classifier", RandomForestClassifier(random_state=RANDOM_STATE, class_weight="balanced")),
        ]
    )
    pipeline.fit(X, y_encoded)

    dump(pipeline, "models/model.pkl")
    dump(le, "models/label_encoder.pkl")

    print("Modelo placeholder guardado en models/")
    print(f"Clases (LabelEncoder): {list(le.classes_)}")
    print(f"Features esperadas ({len(FEATURE_ORDER)}): {FEATURE_ORDER}")


if __name__ == "__main__":
    build_placeholder_model()