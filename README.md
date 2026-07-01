# Sentinel AI | Credit Card Fraud Detection Platform

A production-quality analytics platform for detecting fraudulent credit card transactions using machine learning. Built as an interactive dashboard for university data science presentations.

---

## 📊 Dataset

- **Source:** [Kaggle — European Credit Card Fraud](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud)
- **Size:** 284,808 transactions × 31 features
- **Fraud Cases:** 492 (0.17% — highly imbalanced)
- **Features:** Time, Amount, V1–V28 (PCA-transformed), Class
- **Period:** 2 days in September 2013

## 🤖 Algorithms Implemented

Four models from the reference repository:

| Model | Accuracy | ROC-AUC | Key Characteristic |
|-------|----------|---------|-------------------|
| **K-Nearest Neighbors** | 99.92% | 0.93 | Best overall — distance-based with k=5 |
| **Logistic Regression** | 97.54% | 0.81 | Probabilistic baseline — struggles with imbalance |
| **Support Vector Machine** | 99.91% | 0.90 | RBF kernel for non-linear separation |
| **Decision Tree** | 99.91% | 0.91 | Interpretable rules — prone to overfitting |

## 🚀 Features

- **Exploratory Data Analysis:** Class distribution, correlation heatmap, amount histograms
- **Interactive Data Table:** Sortable, filterable, exportable to CSV
- **Model Training Console:** Real-time logs for all 4 algorithms
- **Comprehensive Evaluation:** ROC curves, PR curves, confusion matrices, radar charts
- **Prediction Center:** Test transactions with KNN (best model) + threshold tuning
- **Dark/Light Mode:** Full theme support
- **Responsive Design:** Works on desktop, tablet, and mobile

## 🛠 Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Recharts, Framer Motion
- **Reference ML:** Python, Scikit-Learn, Jupyter Notebook
- **Dataset:** Kaggle (creditcardfraud)

## 🏗 Project Structure

```
├── src/
│   ├── components/       # UI components (Dashboard, EDA, Models, etc.)
│   ├── constants/        # Dataset stats, model metrics, chart data
│   ├── context/          # Theme provider (dark/light mode)
│   └── App.tsx           # Main application shell
├── python_backend/       # Python ML scripts (optional local training)
│   ├── train.py
│   ├── preprocessing.py
│   └── requirements.txt
├── public/images/        # Hero backgrounds, pipeline visuals
└── README.md
```

## 🎓 Presentation Script

> *"Credit card fraud is a significant problem, with billions of dollars lost each year. Our dataset contains 284,808 European credit card transactions over just two days — but only 492 are fraudulent. That's 0.17%.*
>
> *We implemented four machine learning algorithms from our reference repository: KNN, Logistic Regression, SVM, and Decision Tree. KNN achieved the best performance with 99.92% accuracy and 0.93 ROC-AUC.*
>
> *The Prediction Center lets us test individual transactions in real-time using our best model. When V14 drops below -2, the KNN model flags the transaction as fraudulent with high confidence.*
>
> *This demonstrates the complete data science lifecycle: from data exploration and preprocessing through model training, rigorous evaluation, and interactive deployment."*

