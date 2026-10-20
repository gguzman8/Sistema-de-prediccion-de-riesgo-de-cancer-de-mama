import sys
import types
import unittest
from io import BytesIO

from PIL import Image

if "ultralytics" not in sys.modules:
    ultralytics = types.ModuleType("ultralytics")
    ultralytics.YOLO = object
    sys.modules["ultralytics"] = ultralytics

from app.predictor import InvalidImageError, Predictor, PredictorError


class FakeData:
    def __init__(self, values):
        self.values = values

    def cpu(self):
        return self

    def tolist(self):
        return self.values


class FakeModel:
    def __init__(self, values):
        self.values = values

    def predict(self, **_kwargs):
        probs = types.SimpleNamespace(data=FakeData(self.values))
        return [types.SimpleNamespace(probs=probs)]


def png_bytes():
    output = BytesIO()
    Image.new("RGB", (2, 2), color="white").save(output, format="PNG")
    return output.getvalue()


class PredictorTests(unittest.TestCase):
    def test_rejects_model_without_all_expected_classes(self):
        with self.assertRaises(PredictorError):
            Predictor._normalize_classes({0: "benign"})

    def test_normalizes_class_names_and_prediction_contract(self):
        predictor = Predictor()
        predictor.model = FakeModel([0.1, 0.2, 0.7])
        predictor._classes_by_index = Predictor._normalize_classes(
            {0: "normal", 1: "BENIGN", 2: "Malignant"}
        )

        result = predictor.predict(png_bytes())

        self.assertEqual(result["predicted_class"], "Malignant")
        self.assertEqual(result["probabilities"], {
            "Normal": 0.1,
            "Benign": 0.2,
            "Malignant": 0.7,
        })
        self.assertEqual(result["malignancy_probability"], 0.7)
        self.assertEqual(result["risk_level"], "ALTO RIESGO")

    def test_rejects_invalid_image_bytes(self):
        predictor = Predictor()
        predictor.model = FakeModel([0.1, 0.8, 0.1])
        predictor._classes_by_index = Predictor._normalize_classes(
            {0: "normal", 1: "benign", 2: "malignant"}
        )

        with self.assertRaises(InvalidImageError):
            predictor.predict(b"not-an-image")


if __name__ == "__main__":
    unittest.main()
