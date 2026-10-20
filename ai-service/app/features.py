"""Caracteristicas del modelo definitivo.

El modelo final entrena con metadatos de la lesion, NO con los pixeles de la
mamografia (ver `training/train_model.py` y `models/model_metadata.json`):

    X, Y, RADIUS   coordenadas y tamano de la anomalia (en coordenadas MIAS)
    BG_F, BG_G     densidad glandular one-hot (BG_D es la referencia)
"""

# Feature names exactos del pipeline exportado (mismo orden que en training).
FEATURE_ORDER = [
    "X",
    "Y",
    "RADIUS",
    "BG_F",
    "BG_G",
]

# Clases internas del modelo (espanol, como se entreno) -> clases publicas API.
CLASS_ES = ["NORMAL", "BENIGNO", "MALIGNO"]
CLASS_EN = {
    "NORMAL": "Normal",
    "BENIGNO": "Benign",
    "MALIGNO": "Malignant",
}

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024


def encode_bg(bg_type: str) -> list[float]:
    """Codifica BG (D/F/G) en las columnas one-hot BG_F, BG_G (BG_D = referencia)."""
    bg_type = bg_type.upper()
    if bg_type == "F":
        return [1.0, 0.0]
    if bg_type == "G":
        return [0.0, 1.0]
    return [0.0, 0.0]