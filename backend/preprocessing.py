"""
AutoValuate — Data Preprocessing Pipeline
Cleans the CardEkho dataset and prepares it for ML training.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
import os
import re

# ─── Configuration ───────────────────────────────────────────
DATASET_PATH = os.path.join(os.path.dirname(__file__), "dataset.csv")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "encoder.pkl")
SCALER_PATH  = os.path.join(os.path.dirname(__file__), "scaler.pkl")

# Features used for training
CATEGORICAL_FEATURES = ["brand", "fuel", "transmission", "seller_type", "owner"]
NUMERICAL_FEATURES   = ["age", "km_driven", "mileage", "engine", "max_power", "seats"]
TARGET               = "selling_price"


def load_and_clean(path: str = DATASET_PATH) -> pd.DataFrame:
    """Load CSV and perform all cleaning steps."""
    df = pd.read_csv(path)
    print(f"[1/6] Loaded dataset: {df.shape[0]} rows, {df.shape[1]} columns")

    # ── Extract brand from name (first word) ──
    df["brand"] = df["name"].str.split().str[0]
    print(f"[2/6] Extracted {df['brand'].nunique()} unique brands")

    # ── Clean engine: "1197 CC" → 1197.0 ──
    df["engine"] = df["engine"].apply(_clean_numeric)

    # ── Clean max_power: "88.5 bhp" → 88.5 ──
    df["max_power"] = df["max_power"].apply(_clean_numeric)

    # ── Clean mileage: "19.67 kmpl" or "26.6 km/kg" → float ──
    df["mileage"] = df["mileage"].apply(_clean_numeric)

    # ── Create age feature ──
    df["age"] = 2025 - df["year"]
    print(f"[3/6] Created age feature (range: {df['age'].min()}–{df['age'].max()} years)")

    # ── Convert selling_price to lakhs ──
    df["selling_price"] = df["selling_price"] / 100000.0

    # ── Drop rows with nulls in critical columns ──
    critical = CATEGORICAL_FEATURES + NUMERICAL_FEATURES + [TARGET]
    before = len(df)
    df = df.dropna(subset=critical)
    df = df[df["max_power"] > 0]  # remove zero-power entries
    df = df[df["engine"] > 0]
    after = len(df)
    print(f"[4/6] Dropped {before - after} rows with missing values ({after} remaining)")

    # ── Reset index ──
    df = df.reset_index(drop=True)

    return df


def _clean_numeric(val):
    """Extract first numeric value from a string like '1197 CC' or '88.5 bhp'."""
    if pd.isna(val):
        return np.nan
    val = str(val).strip()
    if val == "" or val == "0":
        return np.nan
    match = re.search(r"[\d.]+", val)
    if match:
        try:
            return float(match.group())
        except ValueError:
            return np.nan
    return np.nan


def encode_and_scale(df: pd.DataFrame) -> tuple:
    """
    Label-encode categoricals, scale numericals.
    Returns (X, y, encoders_dict, scaler).
    """
    encoders = {}

    # ── Label encode categoricals ──
    for col in CATEGORICAL_FEATURES:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
        print(f"  Encoded '{col}': {len(le.classes_)} classes")

    # ── Scale numerical features ──
    scaler = StandardScaler()
    df[NUMERICAL_FEATURES] = scaler.fit_transform(df[NUMERICAL_FEATURES])

    # ── Build feature matrix ──
    feature_cols = CATEGORICAL_FEATURES + NUMERICAL_FEATURES
    X = df[feature_cols].values
    y = df[TARGET].values

    print(f"[5/6] Feature matrix shape: {X.shape}")

    return X, y, encoders, scaler, feature_cols


def save_artifacts(encoders: dict, scaler: StandardScaler):
    """Save encoder and scaler to disk."""
    joblib.dump(encoders, ENCODER_PATH)
    joblib.dump(scaler, SCALER_PATH)
    print(f"[6/6] Saved encoder -> {ENCODER_PATH}")
    print(f"       Saved scaler  -> {SCALER_PATH}")


def run_preprocessing():
    """Full preprocessing pipeline - returns everything needed for training."""
    df = load_and_clean()
    X, y, encoders, scaler, feature_cols = encode_and_scale(df)
    save_artifacts(encoders, scaler)
    return X, y, feature_cols


if __name__ == "__main__":
    print("=" * 60)
    print("AutoValuate - Data Preprocessing")
    print("=" * 60)
    X, y, feature_cols = run_preprocessing()
    print(f"\n[OK] Preprocessing complete.")
    print(f"  Features: {feature_cols}")
    print(f"  X shape : {X.shape}")
    print(f"  y shape : {y.shape}")
    print(f"  Price range: Rs.{y.min():.2f}L - Rs.{y.max():.2f}L")
