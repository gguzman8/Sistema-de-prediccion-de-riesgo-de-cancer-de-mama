"""Prepara MIAS y entrena YOLOv8n-cls con tres clases.

Las mamografias consecutivas de MIAS pertenecen al mismo paciente. La division
se realiza por ese identificador para evitar que vistas del mismo paciente
aparezcan en conjuntos distintos.
"""

import argparse
import json
import os
import random
import shutil
from collections import Counter, defaultdict
from itertools import cycle
from pathlib import Path

import kagglehub
import pandas as pd
from sklearn.metrics import accuracy_score, balanced_accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.model_selection import train_test_split

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DATA_DIR = Path("/tmp/opencode/mias-yolo")
BASE_MODEL = Path("/tmp/opencode/yolov8n-cls.pt")
CLASS_NAMES = ("normal", "benign", "malignant")
SEVERITY_RANK = {"Normal": 0, "Benign": 1, "Malignant": 2}


def patient_id(refnum: str) -> str:
    number = int(refnum.removeprefix("mdb"))
    return f"patient-{(number + 1) // 2:03d}"


def load_studies(dataset_path: Path) -> list[dict]:
    annotations = pd.read_csv(dataset_path / "mias_derived_info.csv")
    grouped = []
    for refnum, rows in annotations.groupby("REFNUM", sort=True):
        labels = [str(value) for value in rows["SEVERITY"]]
        label = max(labels, key=lambda value: SEVERITY_RANK[value])
        image_path = dataset_path / "MIAS" / f"{refnum}.png"
        if not image_path.exists():
            raise FileNotFoundError(f"No se encontro la imagen {image_path}")
        grouped.append({
            "refnum": refnum,
            "patient_id": patient_id(refnum),
            "label": label.lower(),
            "image_path": image_path,
        })
    return grouped


def split_patients(studies: list[dict], seed: int) -> dict[str, set[str]]:
    labels_by_patient = defaultdict(list)
    for study in studies:
        labels_by_patient[study["patient_id"]].append(study["label"])

    patients = sorted(labels_by_patient)
    strata = [
        max(labels_by_patient[patient], key=lambda label: SEVERITY_RANK[label.title()])
        for patient in patients
    ]
    train_patients, remainder, train_strata, remainder_strata = train_test_split(
        patients,
        strata,
        test_size=0.30,
        random_state=seed,
        stratify=strata,
    )
    val_patients, test_patients = train_test_split(
        remainder,
        test_size=0.50,
        random_state=seed,
        stratify=remainder_strata,
    )
    return {
        "train": set(train_patients),
        "val": set(val_patients),
        "test": set(test_patients),
    }


def link_or_copy(source: Path, destination: Path) -> None:
    try:
        os.link(source, destination)
    except OSError:
        shutil.copy2(source, destination)


def prepare_dataset(studies: list[dict], splits: dict[str, set[str]], output: Path) -> dict:
    if output.exists():
        shutil.rmtree(output)
    counts = {}
    for split, patients in splits.items():
        split_counts = Counter()
        studies_by_class = defaultdict(list)
        for class_name in CLASS_NAMES:
            (output / split / class_name).mkdir(parents=True, exist_ok=True)
        for study in studies:
            if study["patient_id"] not in patients:
                continue
            destination = output / split / study["label"] / study["image_path"].name
            link_or_copy(study["image_path"], destination)
            split_counts[study["label"]] += 1
            studies_by_class[study["label"]].append(study)

        # YOLO aplica una transformacion aleatoria en cada lectura. Repetir solo
        # las clases minoritarias equilibra el muestreo sin contaminar val/test.
        if split == "train":
            target = max(split_counts.values())
            for class_name in CLASS_NAMES:
                repeated = cycle(studies_by_class[class_name])
                for repetition in range(target - split_counts[class_name]):
                    study = next(repeated)
                    destination = (
                        output / split / class_name
                        / f"{study['refnum']}_repeat_{repetition:03d}.png"
                    )
                    link_or_copy(study["image_path"], destination)
                    split_counts[class_name] += 1
        counts[split] = {name: split_counts[name] for name in CLASS_NAMES}
    return counts


def evaluate_weights(weights: Path, split_dir: Path) -> dict:
    from ultralytics import YOLO

    image_paths = []
    expected = []
    for class_name in CLASS_NAMES:
        paths = sorted((split_dir / class_name).glob("*.png"))
        image_paths.extend(str(path) for path in paths)
        expected.extend([class_name] * len(paths))

    model = YOLO(str(weights))
    results = model.predict(image_paths, verbose=False)
    predicted = [result.names[result.probs.top1] for result in results]
    return {
        "accuracy": round(float(accuracy_score(expected, predicted)), 6),
        "balanced_accuracy": round(float(balanced_accuracy_score(expected, predicted)), 6),
        "f1_macro": round(float(f1_score(expected, predicted, labels=CLASS_NAMES, average="macro")), 6),
        "confusion_matrix": confusion_matrix(expected, predicted, labels=CLASS_NAMES).tolist(),
        "classification_report": classification_report(
            expected,
            predicted,
            labels=CLASS_NAMES,
            output_dict=True,
            zero_division=0,
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Entrena YOLOv8n-cls con MIAS.")
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch", type=int, default=16)
    parser.add_argument("--imgsz", type=int, default=224)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--select-only", action="store_true", help="Evalua checkpoints existentes sin reentrenar.")
    args = parser.parse_args()

    random.seed(args.seed)
    dataset_path = Path(kagglehub.dataset_download("orvile/mias-dataset"))
    studies = load_studies(dataset_path)
    splits = split_patients(studies, args.seed)
    counts = prepare_dataset(studies, splits, args.data_dir)

    print("Distribucion:", json.dumps(counts, indent=2))
    from ultralytics import YOLO

    save_dir = BASE_DIR / "runs" / "mias-yolov8n-cls"
    if not args.select_only:
        model = YOLO(str(BASE_MODEL))
        result = model.train(
            data=str(args.data_dir),
            epochs=args.epochs,
            imgsz=args.imgsz,
            batch=args.batch,
            workers=args.workers,
            device="cpu",
            seed=args.seed,
            deterministic=True,
            project=str(BASE_DIR / "runs"),
            name="mias-yolov8n-cls",
            exist_ok=True,
            pretrained=True,
            optimizer="AdamW",
            lr0=0.0005,
            lrf=0.05,
            freeze=9,
            auto_augment=None,
            erasing=0.0,
            hsv_h=0.0,
            hsv_s=0.0,
            hsv_v=0.0,
            degrees=5.0,
            translate=0.05,
            scale=0.1,
            patience=15,
            plots=True,
            verbose=True,
        )
        save_dir = Path(result.save_dir)

    weights_dir = save_dir / "weights"
    candidates = {
        name: evaluate_weights(weights_dir / f"{name}.pt", args.data_dir / "val")
        for name in ("best", "last")
    }
    selected_name = max(candidates, key=lambda name: candidates[name]["f1_macro"])
    selected_path = weights_dir / f"{selected_name}.pt"
    test_metrics = evaluate_weights(selected_path, args.data_dir / "test")

    destination = BASE_DIR / "models" / "best.pt"
    shutil.copy2(selected_path, destination)
    metadata = {
        "dataset": "orvile/mias-dataset",
        "model": "yolov8n-cls.pt",
        "classes": list(CLASS_NAMES),
        "seed": args.seed,
        "epochs_requested": args.epochs,
        "imgsz": args.imgsz,
        "batch": args.batch,
        "distribution": counts,
        "checkpoint_selection_metric": "validation_f1_macro",
        "selected_checkpoint": selected_name,
        "validation_candidates": candidates,
        "test_metrics": test_metrics,
        "best_weights": str(destination.relative_to(BASE_DIR)),
    }
    (BASE_DIR / "models" / "model_metadata.json").write_text(
        json.dumps(metadata, indent=2), encoding="utf-8"
    )
    print(f"Modelo exportado a {destination}")


if __name__ == "__main__":
    main()
