"""Genera un modelo PLACEHOLDER para probar el servicio end-to-end.

IMPORTANTE: este modelo NO es el modelo real. Entrena un RandomForest con
datos sinteticos (5 metadatos) solo para que /predict funcione mientras no
exista el modelo entrenado.

Uso:
    python -m app.generate_placeholder_model

Salida:
    models/model.pkl    Pipeline (SimpleImputer + RandomForest)

Reemplazo:
    Cuando entrenes el modelo real ejecuta:
        python -m training.train_model
"""

import numpy as np
import pandas as pd
from joblib import dump
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline

from .features import CLASS_ES, FEATURE_ORDER

N_SAMPLES = 600
RANDOM_STATE = 42


def build_placeholder_model() -> None:
    rng = np.random.default_rng(RANDOM_STATE)

    y = pd.Series(
        ["NORMAL"] * 380 + ["BENIGNO"] * 120 + ["MALIGNO"] * 100
    ).sample(frac=1, random_state=RANDOM_STATE)

    X = pd.DataFrame(rng.normal(size=(N_SAMPLES, len(FEATURE_ORDER))), columns=FEATURE_ORDER)
    X["RADIUS"] = np.where(
        y == "MALIGNO",
        np.abs(rng.normal(80, 20, N_SAMPLES)),
        np.where(y == "BENIGNO", np.abs(rng.normal(30, 15, N_SAMPLES)), 0.0),
    )

    pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="constant", fill_value=0)),
            (
                "classifier",
                RandomForestClassifier(random_state=RANDOM_STATE, class_weight="balanced"),
            ),
        ]
    )
    pipeline.fit(X, y)

    dump(pipeline, "models/model.pkl")

    print("Modelo placeholder guardado en models/")
    print(f"Clases: {list(pipeline.named_steps['classifier'].classes_)}")
    print(f"Features esperadas ({len(FEATURE_ORDER)}): {FEATURE_ORDER}")


if __name__ == "__main__":
    build_placeholder_model()