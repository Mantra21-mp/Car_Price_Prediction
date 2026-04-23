"""
AutoValuate — Model Training Script
Trains 3 models, evaluates, and saves the best one.
"""

import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor
import joblib
import os

from preprocessing import run_preprocessing

# ─── Configuration ───────────────────────────────────────────
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")
TEST_SIZE  = 0.2
RANDOM_STATE = 42


def evaluate_model(model, X_test, y_test) -> dict:
    """Evaluate a model and return metrics."""
    y_pred = model.predict(X_test)
    return {
        "mae":  mean_absolute_error(y_test, y_pred),
        "rmse": np.sqrt(mean_squared_error(y_test, y_pred)),
        "r2":   r2_score(y_test, y_pred),
    }


def train_all_models(X_train, y_train, X_test, y_test):
    """Train 3 models and return results."""
    models = {
        "Random Forest": RandomForestRegressor(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=RANDOM_STATE,
            n_jobs=-1
        ),
        "XGBoost": XGBRegressor(
            n_estimators=300,
            max_depth=7,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=1.0,
            random_state=RANDOM_STATE,
            verbosity=0
        ),
        "Gradient Boosting": GradientBoostingRegressor(
            n_estimators=250,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            min_samples_split=5,
            random_state=RANDOM_STATE
        ),
    }

    results = {}
    for name, model in models.items():
        print(f"\n  Training {name}...")
        model.fit(X_train, y_train)
        metrics = evaluate_model(model, X_test, y_test)
        results[name] = {"model": model, "metrics": metrics}
        print(f"    MAE:  Rs.{metrics['mae']:.3f}L")
        print(f"    RMSE: Rs.{metrics['rmse']:.3f}L")
        print(f"    R2:   {metrics['r2']:.4f}")

    return results


def print_feature_importances(model, feature_names):
    """Print feature importance ranking."""
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        indices = np.argsort(importances)[::-1]
        # Use ASCII bar character for Windows compatibility
        print("\n  Feature Importances:")
        for i, idx in enumerate(indices):
            bar = "#" * int(importances[idx] * 40)
            print(f"    {i+1}. {feature_names[idx]:15s} -> {importances[idx]:.4f}  {bar}")


def main():
    print("=" * 60)
    print("AutoValuate - Model Training")
    print("=" * 60)

    # -- Step 1: Preprocess data --
    print("\n[STEP 1] Preprocessing data...")
    X, y, feature_cols = run_preprocessing()

    # -- Step 2: Train/test split --
    print("\n[STEP 2] Splitting data (80/20)...")
    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )
    print(f"  Train: {X_train.shape[0]} samples")
    print(f"  Test:  {X_test.shape[0]} samples")

    # -- Step 3: Train models --
    print("\n[STEP 3] Training 3 models...")
    results = train_all_models(X_train, y_train, X_test, y_test)

    # -- Step 4: Pick best model --
    print("\n" + "=" * 60)
    print("MODEL COMPARISON")
    print("=" * 60)
    print(f"{'Model':<25} {'MAE':>10} {'RMSE':>10} {'R2':>10}")
    print("-" * 60)

    best_name = None
    best_r2 = -1
    for name, data in results.items():
        m = data["metrics"]
        marker = ""
        if m["r2"] > best_r2:
            best_r2 = m["r2"]
            best_name = name
        print(f"{name:<25} {m['mae']:>9.3f}L {m['rmse']:>9.3f}L {m['r2']:>9.4f}")

    print(f"\n* Best Model: {best_name} (R2 = {best_r2:.4f})")

    # -- Step 5: Save best model --
    best_model = results[best_name]["model"]
    joblib.dump(best_model, MODEL_PATH)
    print(f"\n[OK] Model saved -> {MODEL_PATH}")

    # -- Step 6: Feature importances --
    print_feature_importances(best_model, feature_cols)

    print("\n" + "=" * 60)
    print("Training complete! Run the server with:")
    print("  uvicorn main:app --reload --port 8000")
    print("=" * 60)


if __name__ == "__main__":
    main()
