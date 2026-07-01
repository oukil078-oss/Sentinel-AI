"""
Sentinel AI ML Engine
=====================
Trains real scikit-learn models (Random Forest, KNN, Logistic Regression, Decision Tree, SVM)
on the Kaggle creditcardfraud-style dataset with SMOTE oversampling.

Dataset handling:
- If /app/backend/data/creditcard.csv exists -> load real Kaggle dataset
- Else -> generate a realistic synthetic dataset matching the Kaggle schema
  (28 PCA-transformed features V1-V28, Time, Amount, Class with ~0.17% fraud)
- Models are cached to disk after first training.
"""
from __future__ import annotations

import os
import json
import math
from pathlib import Path
from typing import Dict, Any

import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix,
    roc_curve, precision_recall_curve,
)
from imblearn.over_sampling import SMOTE


class FraudEngine:
    def __init__(self, model_dir: str):
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(exist_ok=True, parents=True)
        self.scaler: StandardScaler | None = None
        self.models: Dict[str, Any] = {}
        self.metrics: Dict[str, Dict[str, float]] = {}
        self.dataset_size: int = 0
        self._df: pd.DataFrame | None = None
        self._feature_names = [f"V{i}" for i in range(1, 29)] + ["Time", "Amount"]
        self._roc_data: Dict[str, list] = {}
        self._pr_data: Dict[str, list] = {}
        self._feat_importance: list = []
        self._correlations: list = []
        self._amount_dist: list = []
        self._class_dist: list = []
        self._threshold_data: list = []

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------
    def is_trained(self) -> bool:
        return (self.model_dir / "metrics.json").exists()

    def is_loaded(self) -> bool:
        return bool(self.models) and self.scaler is not None

    def _save(self):
        joblib.dump(self.scaler, self.model_dir / "scaler.pkl")
        for name, model in self.models.items():
            joblib.dump(model, self.model_dir / f"{name}.pkl")
        payload = {
            "metrics": self.metrics,
            "dataset_size": self.dataset_size,
            "feature_importance": self._feat_importance,
            "correlations": self._correlations,
            "amount_distribution": self._amount_dist,
            "class_distribution": self._class_dist,
            "roc_data": self._roc_data,
            "pr_data": self._pr_data,
            "threshold_data": self._threshold_data,
        }
        (self.model_dir / "metrics.json").write_text(json.dumps(payload))

    def load(self):
        self.scaler = joblib.load(self.model_dir / "scaler.pkl")
        for name in ("random_forest", "knn", "logistic_regression", "decision_tree", "svm"):
            f = self.model_dir / f"{name}.pkl"
            if f.exists():
                self.models[name] = joblib.load(f)
        data = json.loads((self.model_dir / "metrics.json").read_text())
        self.metrics = data["metrics"]
        self.dataset_size = data["dataset_size"]
        self._feat_importance = data["feature_importance"]
        self._correlations = data["correlations"]
        self._amount_dist = data["amount_distribution"]
        self._class_dist = data["class_distribution"]
        self._roc_data = data["roc_data"]
        self._pr_data = data["pr_data"]
        self._threshold_data = data.get("threshold_data", [])

    # ------------------------------------------------------------------
    # Dataset
    # ------------------------------------------------------------------
    def _load_dataset(self) -> pd.DataFrame:
        real_path = Path(__file__).parent / "data" / "creditcard.csv"
        if real_path.exists():
            print(f"[ml] Loading real Kaggle dataset from {real_path}")
            df = pd.read_csv(real_path)
            if len(df) > 50000:
                print(f"[ml] Downsampling real dataset from {len(df)} to 30,000 rows for memory safety and training speed")
                # Keep all fraud cases (Class == 1)
                fraud_df = df[df["Class"] == 1]
                # Sample remaining rows from legitimate cases (Class == 0)
                legit_df = df[df["Class"] == 0].sample(n=30000 - len(fraud_df), random_state=42)
                # Combine and shuffle
                df = pd.concat([fraud_df, legit_df]).sample(frac=1, random_state=42).reset_index(drop=True)
            
            # Reorder columns to match self._feature_names + ["Class"]
            cols = self._feature_names + ["Class"]
            df = df[cols]
            return df

        print("[ml] Generating realistic synthetic dataset matching Kaggle creditcardfraud schema")
        # Mirror the Kaggle creditcardfraud statistics
        # - 28 PCA features (centered near 0, varying stds)
        # - Fraud ~ 0.17%
        # - Fraud transactions have distinct feature distributions (especially V14, V4, V11, V10, V12, V17)
        rng = np.random.default_rng(42)
        n = 30000  # keep training fast but realistic
        fraud_ratio = 0.0173  # ~0.17%
        n_fraud = int(n * fraud_ratio)
        n_legit = n - n_fraud

        # PCA feature stddevs inspired by real dataset
        stds = np.array([
            1.96, 1.65, 1.52, 1.42, 1.38, 1.33, 1.24, 1.19, 1.10, 1.09,
            1.02, 1.00, 0.99, 0.96, 0.92, 0.88, 0.85, 0.84, 0.81, 0.77,
            0.73, 0.73, 0.62, 0.61, 0.52, 0.48, 0.40, 0.33,
        ])

        # Legitimate
        V_legit = rng.normal(0, stds, (n_legit, 28))
        time_legit = rng.uniform(0, 172800, n_legit)
        amount_legit = np.abs(rng.lognormal(3.0, 1.4, n_legit))
        amount_legit = np.clip(amount_legit, 0, 25000)
        class_legit = np.zeros(n_legit)

        # Fraud — shift key discriminative features (V14, V4, V10, V11, V12, V17)
        V_fraud = rng.normal(0, stds, (n_fraud, 28))
        # Strong fraud signals (matching real Kaggle distributions):
        V_fraud[:, 13] += rng.normal(-6.5, 2.5, n_fraud)   # V14 drops drastically
        V_fraud[:, 3]  += rng.normal(4.2, 1.8, n_fraud)    # V4 up
        V_fraud[:, 9]  += rng.normal(-5.5, 2.2, n_fraud)   # V10 down
        V_fraud[:, 10] += rng.normal(3.5, 1.7, n_fraud)    # V11 up
        V_fraud[:, 11] += rng.normal(-4.8, 2.3, n_fraud)   # V12 down
        V_fraud[:, 16] += rng.normal(-6.2, 2.1, n_fraud)   # V17 down
        V_fraud[:, 2]  += rng.normal(-3.5, 1.6, n_fraud)   # V3 down
        V_fraud[:, 6]  += rng.normal(-3.8, 1.7, n_fraud)   # V7 down
        V_fraud[:, 15] += rng.normal(-3.2, 1.5, n_fraud)   # V16 down
        time_fraud = rng.uniform(0, 172800, n_fraud)
        amount_fraud = np.abs(rng.lognormal(4.2, 1.1, n_fraud))
        amount_fraud = np.clip(amount_fraud, 0, 25000)
        class_fraud = np.ones(n_fraud)

        V = np.vstack([V_legit, V_fraud])
        t = np.concatenate([time_legit, time_fraud])
        a = np.concatenate([amount_legit, amount_fraud])
        c = np.concatenate([class_legit, class_fraud])

        df = pd.DataFrame(V, columns=[f"V{i}" for i in range(1, 29)])
        df["Time"] = t
        df["Amount"] = a
        df["Class"] = c.astype(int)
        df = df.sample(frac=1, random_state=42).reset_index(drop=True)
        return df

    # ------------------------------------------------------------------
    # Training
    # ------------------------------------------------------------------
    def train_all(self):
        df = self._load_dataset()
        self._df = df
        self.dataset_size = len(df)

        X = df.drop(columns=["Class"]).values
        y = df["Class"].values

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        self.scaler = StandardScaler().fit(X_train)
        X_train_s = self.scaler.transform(X_train)
        X_test_s = self.scaler.transform(X_test)

        # SMOTE on training set only (never on test)
        smote = SMOTE(random_state=42)
        X_train_res, y_train_res = smote.fit_resample(X_train_s, y_train)
        print(f"[ml] SMOTE applied: {len(X_train)} -> {len(X_train_res)} "
              f"(fraud before: {int(y_train.sum())}, after: {int(y_train_res.sum())})")

        # Subsample for KNN / SVM training speed on resampled data
        if len(X_train_res) > 20000:
            idx = np.random.default_rng(42).choice(len(X_train_res), 20000, replace=False)
            X_knn = X_train_res[idx]
            y_knn = y_train_res[idx]
        else:
            X_knn, y_knn = X_train_res, y_train_res

        # Models
        specs = {
            "random_forest": RandomForestClassifier(n_estimators=120, random_state=42, n_jobs=-1, max_depth=14),
            "knn": KNeighborsClassifier(n_neighbors=5, n_jobs=-1),
            "logistic_regression": LogisticRegression(max_iter=500, random_state=42, n_jobs=-1),
            "decision_tree": DecisionTreeClassifier(random_state=42, max_depth=12),
            "svm": None,  # trained below on smaller subset
        }

        for name, model in specs.items():
            if model is None:
                continue
            print(f"[ml] Training {name}...")
            if name in ("knn",):
                model.fit(X_knn, y_knn)
            else:
                model.fit(X_train_res, y_train_res)
            self.models[name] = model

        # SVM — expensive; train on a smaller balanced subset
        print("[ml] Training svm on balanced subset...")
        n_small = 6000
        idx_small = np.random.default_rng(42).choice(len(X_train_res), n_small, replace=False)
        svm = SVC(kernel="rbf", probability=True, random_state=42, C=1.0, gamma="scale")
        svm.fit(X_train_res[idx_small], y_train_res[idx_small])
        self.models["svm"] = svm

        # Evaluate each
        self.metrics = {}
        self._roc_data = {}
        self._pr_data = {}
        for name, model in self.models.items():
            y_pred = model.predict(X_test_s)
            try:
                y_prob = model.predict_proba(X_test_s)[:, 1]
            except Exception:
                y_prob = y_pred.astype(float)

            cm = confusion_matrix(y_test, y_pred)
            tn, fp, fn, tp = cm.ravel() if cm.size == 4 else (0, 0, 0, 0)

            self.metrics[name] = {
                "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
                "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
                "recall": round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
                "f1": round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
                "roc_auc": round(float(roc_auc_score(y_test, y_prob)), 4),
                "pr_auc": round(float(average_precision_score(y_test, y_prob)), 4),
                "confusion_matrix": {"tp": int(tp), "fp": int(fp), "tn": int(tn), "fn": int(fn)},
            }

            fpr, tpr, _ = roc_curve(y_test, y_prob)
            # downsample to ~30 points
            idxs = np.linspace(0, len(fpr) - 1, 30).astype(int)
            self._roc_data[name] = [
                {"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)} for i in idxs
            ]
            precision_arr, recall_arr, _ = precision_recall_curve(y_test, y_prob)
            idxs = np.linspace(0, len(precision_arr) - 1, 30).astype(int)
            self._pr_data[name] = [
                {"recall": round(float(recall_arr[i]), 4), "precision": round(float(precision_arr[i]), 4)}
                for i in idxs
            ]

        # Feature importance (from RF)
        rf = self.models["random_forest"]
        importances = rf.feature_importances_
        pairs = sorted(zip(self._feature_names, importances), key=lambda x: x[1], reverse=True)
        self._feat_importance = [
            {"feature": f, "importance": round(float(i), 4)} for f, i in pairs[:15]
        ]

        # Correlations
        corrs = df.corr(numeric_only=True)["Class"].drop("Class").sort_values()
        top = list(corrs.head(5).items()) + list(corrs.tail(5).items())
        self._correlations = [
            {"feature": k, "correlation": round(float(v), 3)} for k, v in top
        ]

        # Class distribution
        counts = df["Class"].value_counts()
        self._class_dist = [
            {"name": "Legitimate", "value": int(counts.get(0, 0)), "color": "#C6F24E"},
            {"name": "Fraudulent", "value": int(counts.get(1, 0)), "color": "#FF3B30"},
        ]

        # Amount distribution
        bins = [0, 50, 100, 200, 500, 1000, 25001]
        labels = ["0-50", "50-100", "100-200", "200-500", "500-1000", "1000+"]
        binned = pd.cut(df["Amount"], bins=bins, labels=labels, include_lowest=True)
        amount_counts = binned.value_counts().sort_index()
        self._amount_dist = [
            {"range": str(r), "count": int(c)} for r, c in amount_counts.items()
        ]

        # Threshold sweep for RF
        thresholds = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
        self._threshold_data = []
        rf_probs = rf.predict_proba(X_test_s)[:, 1]
        for t in thresholds:
            preds = (rf_probs >= t).astype(int)
            self._threshold_data.append({
                "threshold": t,
                "precision": round(float(precision_score(y_test, preds, zero_division=0)), 3),
                "recall": round(float(recall_score(y_test, preds, zero_division=0)), 3),
                "f1": round(float(f1_score(y_test, preds, zero_division=0)), 3),
            })

        self._save()

    # ------------------------------------------------------------------
    # Inference
    # ------------------------------------------------------------------
    def predict(self, features: dict, model: str = "random_forest", threshold: float = 0.5) -> dict:
        if model not in self.models:
            raise ValueError(f"Model {model} not available")
        vec = np.array([[features[n] for n in self._feature_names]])
        vec_s = self.scaler.transform(vec)
        m = self.models[model]
        try:
            prob = float(m.predict_proba(vec_s)[0, 1])
        except Exception:
            prob = float(m.predict(vec_s)[0])
        is_fraud = prob >= threshold

        # Risk level buckets
        if prob >= 0.85:
            risk = "critical"
        elif prob >= 0.6:
            risk = "high"
        elif prob >= 0.3:
            risk = "medium"
        else:
            risk = "low"

        # Feature explanations (top 5 contributions) — works for every model
        explanations = []
        feat_names = self._feature_names
        input_vals = vec[0]
        if model == "random_forest" or model == "decision_tree":
            importances = m.feature_importances_
            pairs = sorted(zip(feat_names, importances, input_vals),
                           key=lambda x: x[1], reverse=True)[:5]
            for name, imp, val in pairs:
                explanations.append({
                    "feature": name,
                    "value": round(float(val), 3),
                    "importance": round(float(imp), 3),
                })
        elif model == "logistic_regression":
            coefs = np.abs(m.coef_[0])
            total = coefs.sum() or 1.0
            pairs = sorted(zip(feat_names, coefs / total, input_vals),
                           key=lambda x: x[1], reverse=True)[:5]
            for name, imp, val in pairs:
                explanations.append({
                    "feature": name,
                    "value": round(float(val), 3),
                    "importance": round(float(imp), 3),
                })
        else:
            # knn / svm fall back to the RF global ranking cached during training
            rf_rank = {d["feature"]: d["importance"] for d in self._feat_importance}
            pairs = sorted(
                zip(feat_names, [rf_rank.get(n, 0.0) for n in feat_names], input_vals),
                key=lambda x: x[1], reverse=True,
            )[:5]
            for name, imp, val in pairs:
                explanations.append({
                    "feature": name,
                    "value": round(float(val), 3),
                    "importance": round(float(imp), 3),
                })

        return {
            "model": model,
            "threshold": threshold,
            "probability": round(prob, 4),
            "is_fraud": bool(is_fraud),
            "risk_level": risk,
            "confidence": round(abs(prob - 0.5) * 2, 4),
            "explanations": explanations,
        }

    # ------------------------------------------------------------------
    # Accessors
    # ------------------------------------------------------------------
    def get_all_metrics(self): return self.metrics
    def feature_importance(self): return self._feat_importance
    def correlations(self): return self._correlations
    def amount_distribution(self): return self._amount_dist
    def class_distribution(self): return self._class_dist
    def roc_curves(self): return self._roc_data
    def pr_curves(self): return self._pr_data
    def threshold_sweep(self): return self._threshold_data
