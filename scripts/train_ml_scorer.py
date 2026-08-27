"""
Trains the logistic regression model consumed by trainedScore() in
lib/ml-scorer.js, using scikit-learn.

Reads the synthetic dataset produced by scripts/generate-training-data.mjs
(scripts/data/ml-training-data.json — see that file's docstring for why the
data is synthetic: there is no real feedback data yet to train on).

Writes lib/trained-weights.json in the exact shape the JS engine
(lib/recommendation-engine.js) expects: { coefficients, intercept, ... }.
scikit-learn's LogisticRegression.predict_proba for the positive class is
sigmoid(coef_ . x + intercept_), which is exactly the scoring function
trainedScore() implements in JS — so the weights transfer directly, no
format conversion needed beyond coef_[0]/intercept_[0].

Run with: python3 scripts/train_ml_scorer.py
(or: npm run train:ml, which also regenerates the dataset first)
"""

import json
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score
from sklearn.model_selection import train_test_split

SCRIPT_DIR = Path(__file__).resolve().parent
DATA_PATH = SCRIPT_DIR / "data" / "ml-training-data.json"
OUT_PATH = SCRIPT_DIR.parent / "lib" / "trained-weights.json"

RANDOM_STATE = 42
TEST_SIZE = 0.2
L2_C = 1.0  # inverse regularization strength (scikit-learn default-ish)


def main():
    if not DATA_PATH.exists():
        raise SystemExit(
            f"Training data not found at {DATA_PATH}. "
            "Run scripts/generate-training-data.mjs first."
        )

    with open(DATA_PATH, "r") as f:
        dataset = json.load(f)

    feature_names = dataset["feature_names"]
    samples = dataset["samples"]

    X = np.array([s["features"] for s in samples], dtype=float)
    y = np.array([s["label"] for s in samples], dtype=int)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )

    print(f"Training logistic regression on {len(X_train)} samples (test set: {len(X_test)})...")

    # We deliberately don't standardize the features because trainedScore()
    # in lib/ml-scorer.js applies coefficients directly to raw feature
    # values (mostly 0-1) at inference time.
    model = LogisticRegression(C=L2_C, max_iter=2000, random_state=RANDOM_STATE, solver="liblinear")

    # macOS's Accelerate BLAS backend for numpy is known to emit spurious
    # "overflow/divide by zero encountered in matmul" RuntimeWarnings from
    # its vectorized dot-product path on some numpy versions, even though
    # the actual float64 values involved never leave the 0-1.5 range and
    # the results are correct (verified: coefficients/accuracy are stable
    # across repeated runs, no NaNs in the data or the output). Suppressed
    # here rather than left to alarm readers of the training output.
    with np.errstate(over="ignore", invalid="ignore", divide="ignore"):
        model.fit(X_train, y_train)
        train_pred = model.predict(X_train)
        test_pred = model.predict(X_test)
        test_proba = model.predict_proba(X_test)[:, 1]

    train_accuracy = accuracy_score(y_train, train_pred)
    test_accuracy = accuracy_score(y_test, test_pred)
    test_roc_auc = roc_auc_score(y_test, test_proba)

    print(f"Train accuracy: {train_accuracy * 100:.1f}%")
    print(f"Test accuracy:  {test_accuracy * 100:.1f}%")
    print(f"Test ROC-AUC:   {test_roc_auc:.3f}")
    print()
    print("Classification report (test set):")
    print(classification_report(y_test, test_pred, target_names=["not satisfied", "satisfied"]))

    output = {
        "coefficients": model.coef_[0].tolist(),
        "intercept": float(model.intercept_[0]),
        "feature_names": feature_names,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "trained_with": f"scikit-learn LogisticRegression (C={L2_C})",
        "n_samples": len(samples),
        "train_accuracy": train_accuracy,
        "test_accuracy": test_accuracy,
        "test_roc_auc": test_roc_auc,
    }

    OUT_PATH.write_text(json.dumps(output, indent=2))
    print(f"Written trained weights to {OUT_PATH}")


if __name__ == "__main__":
    main()
