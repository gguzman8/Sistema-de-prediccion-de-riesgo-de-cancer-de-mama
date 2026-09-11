from typing import Optional

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    classes: Optional[list[str]] = None


class PredictionResponse(BaseModel):
    predicted_class: str
    probabilities: dict[str, float]
    malignancy_probability: float
    risk_level: str