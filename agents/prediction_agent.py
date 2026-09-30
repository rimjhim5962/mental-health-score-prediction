"""Run inference with the existing, unchanged trained model."""

from pathlib import Path

import joblib
import pandas as pd


MODEL_PATH = Path(__file__).resolve().parent.parent / "mental-health-score-model.pkl"
model = joblib.load(MODEL_PATH)


def predict_score(input_row: pd.DataFrame) -> float:
    """Return the model's original 0-10 prediction rounded to two decimals."""
    prediction = model.predict(input_row)[0]
    return round(float(prediction), 2)