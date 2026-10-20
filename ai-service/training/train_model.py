"""Flujo reproducible para entrenar y exportar el modelo definitivo.

Este script reemplaza las celdas inconsistentes de `modeloChecar.ipynb` con un
flujo controlado:

  1. Descarga el dataset MIAS (Kaggle: `orvile/mias-dataset`).
  2. Mapea clases: SEVERITY B -> BENIGNO, SEVERITY M -> MALIGNO, CLASS=NORM -> NORMAL.
  3. Consolida imagenes con varias lesiones conservando la de mayor severidad.
  4. Usa exactamente las caracteristicas X, Y, RADIUS, BG_F, BG_G.
  5. Reserva 20 % estratificado para prueba (nunca se toca hasta evaluar).
  6. Selecciona hiperparametros con validacion cruzada priorizando la
     sensibilidad de la clase MALIGNO (F1 macro como criterio secundario).
  7. Evalua el test UNA sola vez y guarda metadatos/metricas en JSON.
  8. Exporta un pipeline de inferencia (imputador + RandomForest, SIN SMOTE)
     para que el servicio web no necesite `imbalanced-learn`.

Uso:
    python -m training.train_model

Dependencias (extra): kagglehub, imbalanced-learn (ver requirements-training.txt).
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImblearnPipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    balanced_accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, train_test_split
from sklearn.preprocessing import label_binarize

BASE_DIR = Path(__file__).resolve().parent.parent
MODELS_DIR = BASE_DIR / "models"
OUTPUTS_DIR = BASE_DIR / "training" / "outputs"
DATASET_NAME = "orvile/mias-dataset"
RANDOM_STATE = 42
TARGET = "CLASS_MAPPED"

CLASS_ORDER = ["NORMAL", "BENIGNO", "MALIGNO"]
CLASS_EN = {"NORMAL": "Normal", "BENIGNO": "Benign", "MALIGNO": "Malignant"}
SEVERITY_RANK = {"NORMAL": 0, "BENIGNO": 1, "MALIGNO": 2}
FEATURE_ORDER = ["X", "Y", "RADIUS", "BG_F", "BG_G"]

# Candidatos probados por validacion cruzada. El primero replica los
# hiperparametros finales reportados en modeloChecar.ipynb.
CANDIDATES = [
    {"name": "notebook_final", "classifier__n_estimators": 500, "classifier__max_depth": 5,
     "classifier__min_samples_split": 10, "classifier__min_samples_leaf": 4,
     "classifier__max_features": None, "classifier__class_weight": None},
    {"name": "ref1", "classifier__n_estimators": 300, "classifier__max_depth": None,
     "classifier__min_samples_split": 2, "classifier__min_samples_leaf": 1,
     "classifier__max_features": "sqrt", "classifier__class_weight": "balanced"},
    {"name": "ref2", "classifier__n_estimators": 300, "classifier__max_depth": 10,
     "classifier__min_samples_split": 5, "classifier__min_samples_leaf": 2,
     "classifier__max_features": "log2", "classifier__class_weight": "balanced_subsample"},
    {"name": "ref3", "classifier__n_estimators": 500, "classifier__max_depth": None,
     "classifier__min_samples_split": 2, "classifier__min_samples_leaf": 1,
     "classifier__max_features": None, "classifier__class_weight": "balanced"},
    {"name": "ref4", "classifier__n_estimators": 200, "classifier__max_depth": 5,
     "classifier__min_samples_split": 10, "classifier__min_samples_leaf": 4,
     "classifier__max_features": "sqrt", "classifier__class_weight": None},
    {"name": "ref5", "classifier__n_estimators": 500, "classifier__max_depth": 15,
     "classifier__min_samples_split": 5, "classifier__min_samples_leaf": 2,
     "classifier__max_features": None, "classifier__class_weight": "balanced_subsample"},
]


def download_dataset(data_path: str | None) -> Path:
    if data_path:
        path = Path(data_path)
        if not (path / "mias_info.csv").exists():
            raise ValueError(f"No se encontro mias_info.csv en {path}")
        return path
    import kagglehub

    return Path(kagglehub.dataset_download(DATASET_NAME))


def load_and_clean(data_path: str | None) -> pd.DataFrame:
    base = download_dataset(data_path)
    df = pd.read_csv(base / "mias_info.csv")
    df = df.dropna(axis=1, how="all")

    conditions = [
        df["SEVERITY"] == "B",
        df["SEVERITY"] == "M",
        df["CLASS"] == "NORM",
    ]
    choices = ["BENIGNO", "MALIGNO", "NORMAL"]
    df[TARGET] = np.select(conditions, choices, default=None)
    df = df.dropna(subset=[TARGET]).copy()

    # Consolidar imagenes duplicadas con la lesion de mayor severidad.
    df["_rank"] = df[TARGET].map(SEVERITY_RANK)
    df = df.sort_values("_rank", ascending=False).drop_duplicates(subset=["REFNUM"], keep="first")
    df = df.drop(columns=["_rank"])

    return df.sort_values("REFNUM").reset_index(drop=True)


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    features = df[["BG", "X", "Y", "RADIUS"]].copy()
    features = pd.get_dummies(features, columns=["BG"], prefix="BG", drop_first=True)
    # Garantizar el orden exacto esperado por el modelo (BG_F, BG_G).
    for col in ["BG_F", "BG_G"]:
        if col not in features.columns:
            features[col] = 0
    return features[FEATURE_ORDER]


def build_pipeline(params: dict) -> ImblearnPipeline:
    pipeline = ImblearnPipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="constant", fill_value=0)),
            ("smote", SMOTE(random_state=RANDOM_STATE, k_neighbors=1)),
            (
                "classifier",
                RandomForestClassifier(random_state=RANDOM_STATE, n_jobs=-1),
            ),
        ]
    )
    pipeline.set_params(
        **{k: v for k, v in params.items() if k.startswith("classifier__")}
    )
    return pipeline


def select_best_candidate(X_train: pd.DataFrame, y_train: pd.Series) -> dict:
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    results = []
    for cand in CANDIDATES:
        pipeline = build_pipeline(cand)
        scores = {
            "recall_maligno": np.zeros(5),
            "f1_macro": np.zeros(5),
            "balanced_accuracy": np.zeros(5),
        }
        for fold, (tr, va) in enumerate(skf.split(X_train, y_train)):
            X_tr, X_va = X_train.iloc[tr], X_train.iloc[va]
            y_tr, y_va = y_train.iloc[tr], y_train.iloc[va]
            pipeline.fit(X_tr, y_tr)
            y_pred = pipeline.predict(X_va)
            scores["recall_maligno"][fold] = recall_score(
                y_va, y_pred, labels=["MALIGNO"], average=None, zero_division=0
            )[0]
            scores["f1_macro"][fold] = f1_score(y_va, y_pred, average="macro", zero_division=0)
            scores["balanced_accuracy"][fold] = balanced_accuracy_score(y_va, y_pred)
        results.append(
            {
                "name": cand["name"],
                "params": cand,
                **{k: float(np.mean(s)) for k, s in scores.items()},
            }
        )

    df_res = pd.DataFrame(results)
    # Prioridad: recall MALIGNO; desempate con F1 macro y balanced accuracy.
    df_res = df_res.sort_values(
        ["recall_maligno", "f1_macro", "balanced_accuracy"], ascending=False
    )
    best = df_res.iloc[0]
    print("\n== Seleccion por validacion cruzada ==")
    print(df_res.round(4).to_string(index=False))
    print(f"\nMejor candidato: {best['name']} (recall MALIGNO={best['recall_maligno']:.4f}, "
          f"F1 macro={best['f1_macro']:.4f})")
    return {
        "name": best["name"],
        "params": CANDIDATES[int(best.name)],
        "cv_metrics": {
            "recall_maligno": best["recall_maligno"],
            "f1_macro": best["f1_macro"],
            "balanced_accuracy": best["balanced_accuracy"],
        },
    }


def _specificity(y_true: pd.Series, y_pred: np.ndarray, pos_label: str) -> float:
    cm = confusion_matrix(y_true, y_pred, labels=CLASS_ORDER)
    idx = CLASS_ORDER.index(pos_label)
    tp = cm[idx, idx]
    fn = cm[idx, :].sum() - tp
    fp = cm[:, idx].sum() - tp
    tn = cm.sum() - tp - fn - fp
    return float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0


def evaluate_test(model, X_test: pd.DataFrame, y_test: pd.Series) -> dict:
    y_pred = model.predict(X_test)
    classes_model = list(model.named_steps["classifier"].classes_)
    y_proba = model.predict_proba(X_test)

    report = classification_report(y_test, y_pred, labels=CLASS_ORDER, output_dict=True, zero_division=0)
    metrics = {
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "balanced_accuracy": float(balanced_accuracy_score(y_test, y_pred)),
        "precision_macro": float(precision_score(y_test, y_pred, average="macro", zero_division=0)),
        "recall_macro": float(recall_score(y_test, y_pred, average="macro", zero_division=0)),
        "f1_macro": float(f1_score(y_test, y_pred, average="macro", zero_division=0)),
    }
    for cls in CLASS_ORDER:
        metrics[f"precision_{cls}"] = float(report[cls]["precision"])
        metrics[f"recall_{cls}"] = float(report[cls]["recall"])
        metrics[f"f1_{cls}"] = float(report[cls]["f1-score"])
        metrics[f"support_{cls}"] = int(report[cls]["support"])
        metrics[f"specificity_{cls}"] = _specificity(y_test, y_pred, cls)

    y_bin = label_binarize(y_test, classes=CLASS_ORDER)
    y_proba = pd.DataFrame(y_proba, columns=classes_model)[
        CLASS_ORDER
    ].to_numpy()
    try:
        metrics["roc_auc_macro"] = float(roc_auc_score(y_bin, y_proba, average="macro", multi_class="ovr"))
    except ValueError:
        metrics["roc_auc_macro"] = None
    metrics["confusion_matrix"] = {
        "labels": CLASS_ORDER,
        "matrix": confusion_matrix(y_test, y_pred, labels=CLASS_ORDER).tolist(),
    }
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Entrena y exporta el modelo de metadatos MIAS.")
    parser.add_argument("--data-path", default=None, help="Ruta local del dataset (opcional).")
    parser.add_argument("--skip-cv", action="store_true", help="Usa los hiperparametros del notebook sin CV.")
    args = parser.parse_args()

    df = load_and_clean(args.data_path)
    X = build_features(df)
    y = df[TARGET]

    print(f"Dataset: {DATASET_NAME}")
    print(f"Muestras: {len(df)} unicas tras consolidar por imagen")
    print(f"Distribucion: {y.value_counts().to_dict()}")
    print(f"Caracteristicas: {FEATURE_ORDER}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=RANDOM_STATE
    )

    if args.skip_cv:
        best = {
            "name": "notebook_final",
            "params": {k: v for k, v in CANDIDATES[0].items() if k != "name"},
            "cv_metrics": {},
        }
    else:
        best = select_best_candidate(X_train, y_train)

    training_pipeline = build_pipeline(best["params"])

    X_train_imputed = pd.DataFrame(
        SimpleImputer(strategy="constant", fill_value=0).fit_transform(X_train),
        columns=FEATURE_ORDER,
    )
    print("\nEntrenando modelo final sobre el conjunto de entrenamiento completo...")
    training_pipeline.fit(X_train, y_train)
    print(f"Clases aprendidas: {list(training_pipeline.named_steps['classifier'].classes_)}")

    print("\n== Evaluacion UNA vez sobre el conjunto de prueba ==")
    test_metrics = evaluate_test(training_pipeline, X_test, y_test)
    print(json.dumps(test_metrics, indent=2, ensure_ascii=False))

    importance = dict(
        zip(
            FEATURE_ORDER,
            training_pipeline.named_steps["classifier"].feature_importances_.tolist(),
        )
    )

    # Pipeline de inferencia: imputador + RandomForest (sin SMOTE, sklearn puro).
    from sklearn.pipeline import Pipeline as SklearnPipeline

    inference_pipeline = SklearnPipeline(
        steps=[
            ("imputer", training_pipeline.named_steps["imputer"]),
            (
                "classifier",
                training_pipeline.named_steps["classifier"],
            ),
        ]
    )

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

    model_path = MODELS_DIR / "model.pkl"
    joblib.dump(inference_pipeline, model_path)

    metadata = {
        "dataset": DATASET_NAME,
        "created_at": pd.Timestamp.now().isoformat(),
        "selection": best["name"],
        "hyperparameters": best["params"],
        "cv_metrics": best["cv_metrics"],
        "test_metrics": test_metrics,
        "feature_order": FEATURE_ORDER,
        "classes": CLASS_ORDER,
        "classes_en": CLASS_EN,
        "class_distribution": y.value_counts().to_dict(),
        "train_size": int(len(X_train)),
        "test_size": int(len(X_test)),
        "test_distribution": {k: v for k, v in y_test.value_counts().items()},
        "feature_importance": importance,
        "notes": (
            "Modelo basado en metadatos de la lesion (X, Y, RADIUS) y densidad glandular (BG). "
            "NO analiza los pixeles de la mamografia."
        ),
    }
    metadata_path = MODELS_DIR / "model_metadata.json"
    metadata_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=False))

    metrics_path = OUTPUTS_DIR / "test_metrics.json"
    metrics_path.write_text(json.dumps(test_metrics, indent=2, ensure_ascii=False))

    print(f"\nModelo guardado: {model_path}")
    print(f"Metadatos: {metadata_path}")
    print(f"Metricas: {metrics_path}")


if __name__ == "__main__":
    main()