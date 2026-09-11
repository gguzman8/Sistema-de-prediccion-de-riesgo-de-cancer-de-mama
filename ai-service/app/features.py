import io

import numpy as np
from PIL import Image
from skimage.feature import graycomatrix, graycoprops

from .config import settings

# Feature names exactos del df_processed del notebook (mismo orden).
FEATURE_ORDER = [
    "X",
    "Y",
    "RADIUS",
    "img_mean",
    "img_std",
    "img_min",
    "img_max",
    "img_median",
    "glcm_contrast",
    "glcm_energy",
    "glcm_homogeneity",
    "glcm_correlation",
    "glcm_dissimilarity",
    "has_lesion",
    "BG_D",
    "BG_F",
    "BG_G",
]

IMAGE_FEATURE_COLUMNS = [
    "img_mean",
    "img_std",
    "img_min",
    "img_max",
    "img_median",
    "glcm_contrast",
    "glcm_energy",
    "glcm_homogeneity",
    "glcm_correlation",
    "glcm_dissimilarity",
]

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024


class ImagePreprocessingError(Exception):
    pass


def preprocess_image(image_bytes: bytes) -> np.ndarray | None:
    """
    Replica 'preprocess_image' del notebook:
    convierte a escala de grises, redimensiona a 128x128 y normaliza a [0, 1].
    """
    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            img = img.convert("L")
            img = img.resize(settings.image_size)
            img_array = np.array(img) / 255.0
        return img_array
    except Exception:
        return None


def extract_image_features(img_array: np.ndarray | None) -> np.ndarray:
    """
    Replica 'extract_image_features' del notebook:
    estadisticas globales (5) + textura GLCM (5) = 10 características.
    """
    if img_array is None:
        return np.full(10, np.nan)

    features = [
        np.mean(img_array),
        np.std(img_array),
        np.min(img_array),
        np.max(img_array),
        np.median(img_array),
    ]

    img_256 = (img_array * 255).astype(np.uint8)

    try:
        glcm = graycomatrix(img_256, [1], [0], levels=256, symmetric=True, normed=True)
        features.append(graycoprops(glcm, "contrast")[0, 0])
        features.append(graycoprops(glcm, "energy")[0, 0])
        features.append(graycoprops(glcm, "homogeneity")[0, 0])
        features.append(graycoprops(glcm, "correlation")[0, 0])
        features.append(graycoprops(glcm, "dissimilarity")[0, 0])
    except ValueError:
        features.extend(np.full(5, np.nan))

    return np.array(features, dtype=float)