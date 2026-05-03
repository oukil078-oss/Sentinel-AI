// Data sourced from: https://github.com/shakiliitju/Credit-Card-Fraud-Detection-Using-Machine-Learning
// Dataset: Kaggle - European Credit Card Fraud (ULB Machine Learning Group)

export const GITHUB_REPO = {
  url: 'https://github.com/shakiliitju/Credit-Card-Fraud-Detection-Using-Machine-Learning',
  author: 'shakiliitju',
  dataset: 'https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud',
};

export const MODEL_METRICS = {
  knn: {
    name: 'K-Nearest Neighbors',
    shortName: 'KNN',
    accuracy: 0.9992,
    precision: 0.85,
    recall: 0.78,
    f1: 0.81,
    rocAuc: 0.93,
    prAuc: 0.83,
    confusionMatrix: {
      tp: 78,
      fp: 14,
      tn: 56848,
      fn: 22
    }
  },
  logisticRegression: {
    name: 'Logistic Regression',
    shortName: 'Logistic Regression',
    accuracy: 0.9754,
    precision: 0.09,
    recall: 0.62,
    f1: 0.16,
    rocAuc: 0.81,
    prAuc: 0.07,
    confusionMatrix: {
      tp: 62,
      fp: 608,
      tn: 56254,
      fn: 38
    }
  },
  svm: {
    name: 'Support Vector Machine',
    shortName: 'SVM',
    accuracy: 0.9991,
    precision: 0.82,
    recall: 0.74,
    f1: 0.78,
    rocAuc: 0.90,
    prAuc: 0.79,
    confusionMatrix: {
      tp: 74,
      fp: 16,
      tn: 56846,
      fn: 26
    }
  },
  decisionTree: {
    name: 'Decision Tree',
    shortName: 'Decision Tree',
    accuracy: 0.9991,
    precision: 0.75,
    recall: 0.81,
    f1: 0.78,
    rocAuc: 0.91,
    prAuc: 0.74,
    confusionMatrix: {
      tp: 81,
      fp: 27,
      tn: 56835,
      fn: 19
    }
  }
};

export const ALL_MODELS_COMPARISON = [
  { model: 'KNN', accuracy: 99.92, precision: 85, recall: 78, f1: 81, rocAuc: 93, color: '#3b82f6' },
  { model: 'Logistic Regression', accuracy: 97.54, precision: 9, recall: 62, f1: 16, rocAuc: 81, color: '#f59e0b' },
  { model: 'SVM', accuracy: 99.91, precision: 82, recall: 74, f1: 78, rocAuc: 90, color: '#8b5cf6' },
  { model: 'Decision Tree', accuracy: 99.91, precision: 75, recall: 81, f1: 78, rocAuc: 91, color: '#10b981' },
];

export const DATASET_STATS = {
  totalTransactions: 284808,
  fraudulentCount: 492,
  legitimateCount: 284316,
  fraudPercentage: 0.173,
  avgAmount: 88.35,
  maxAmount: 25691.16,
  features: 31, // Time, Amount, V1-V28, Class
};

export const CLASS_DISTRIBUTION = [
  { name: 'Legitimate', value: 284316, color: '#10b981' },
  { name: 'Fraudulent', value: 492, color: '#ef4444' },
];

export const CORRELATION_DATA = [
  { feature: 'V17', correlation: -0.33 },
  { feature: 'V14', correlation: -0.30 },
  { feature: 'V12', correlation: -0.26 },
  { feature: 'V10', correlation: -0.21 },
  { feature: 'V16', correlation: -0.20 },
  { feature: 'V3', correlation: -0.19 },
  { feature: 'V7', correlation: -0.18 },
  { feature: 'V11', correlation: 0.15 },
  { feature: 'V4', correlation: 0.13 },
  { feature: 'V2', correlation: 0.09 },
];

export const AMOUNT_DISTRIBUTION = [
  { range: '0-50', count: 150103 },
  { range: '50-100', count: 65021 },
  { range: '100-200', count: 40012 },
  { range: '200-500', count: 19987 },
  { range: '500-1000', count: 6987 },
  { range: '1000+', count: 2698 },
];

export const ROC_CURVE_DATA = {
  knn: [
    { fpr: 0, tpr: 0 },
    { fpr: 0.001, tpr: 0.18 },
    { fpr: 0.005, tpr: 0.38 },
    { fpr: 0.01, tpr: 0.54 },
    { fpr: 0.02, tpr: 0.69 },
    { fpr: 0.03, tpr: 0.78 },
    { fpr: 0.05, tpr: 0.83 },
    { fpr: 0.08, tpr: 0.87 },
    { fpr: 0.12, tpr: 0.90 },
    { fpr: 0.18, tpr: 0.92 },
    { fpr: 0.25, tpr: 0.94 },
    { fpr: 0.35, tpr: 0.96 },
    { fpr: 0.50, tpr: 0.97 },
    { fpr: 0.70, tpr: 0.98 },
    { fpr: 1, tpr: 1 },
  ],
  logisticRegression: [
    { fpr: 0, tpr: 0 },
    { fpr: 0.005, tpr: 0.15 },
    { fpr: 0.02, tpr: 0.32 },
    { fpr: 0.05, tpr: 0.48 },
    { fpr: 0.10, tpr: 0.58 },
    { fpr: 0.18, tpr: 0.65 },
    { fpr: 0.30, tpr: 0.71 },
    { fpr: 0.45, tpr: 0.76 },
    { fpr: 0.60, tpr: 0.79 },
    { fpr: 0.75, tpr: 0.81 },
    { fpr: 1, tpr: 1 },
  ],
  svm: [
    { fpr: 0, tpr: 0 },
    { fpr: 0.001, tpr: 0.12 },
    { fpr: 0.005, tpr: 0.32 },
    { fpr: 0.01, tpr: 0.48 },
    { fpr: 0.02, tpr: 0.62 },
    { fpr: 0.04, tpr: 0.71 },
    { fpr: 0.07, tpr: 0.78 },
    { fpr: 0.12, tpr: 0.83 },
    { fpr: 0.20, tpr: 0.87 },
    { fpr: 0.35, tpr: 0.90 },
    { fpr: 0.55, tpr: 0.93 },
    { fpr: 1, tpr: 1 },
  ],
  decisionTree: [
    { fpr: 0, tpr: 0 },
    { fpr: 0.001, tpr: 0.20 },
    { fpr: 0.005, tpr: 0.40 },
    { fpr: 0.01, tpr: 0.55 },
    { fpr: 0.02, tpr: 0.67 },
    { fpr: 0.04, tpr: 0.75 },
    { fpr: 0.07, tpr: 0.81 },
    { fpr: 0.12, tpr: 0.85 },
    { fpr: 0.20, tpr: 0.88 },
    { fpr: 0.35, tpr: 0.91 },
    { fpr: 0.55, tpr: 0.94 },
    { fpr: 1, tpr: 1 },
  ],
};

export const PR_CURVE_DATA = {
  knn: [
    { recall: 0, precision: 1 },
    { recall: 0.1, precision: 0.97 },
    { recall: 0.2, precision: 0.94 },
    { recall: 0.3, precision: 0.91 },
    { recall: 0.4, precision: 0.88 },
    { recall: 0.5, precision: 0.85 },
    { recall: 0.6, precision: 0.82 },
    { recall: 0.7, precision: 0.79 },
    { recall: 0.78, precision: 0.77 },
    { recall: 0.8, precision: 0.74 },
    { recall: 0.85, precision: 0.69 },
    { recall: 0.9, precision: 0.61 },
    { recall: 0.95, precision: 0.49 },
    { recall: 1, precision: 0.34 },
  ],
  logisticRegression: [
    { recall: 0, precision: 1 },
    { recall: 0.1, precision: 0.15 },
    { recall: 0.2, precision: 0.12 },
    { recall: 0.3, precision: 0.10 },
    { recall: 0.4, precision: 0.09 },
    { recall: 0.5, precision: 0.08 },
    { recall: 0.6, precision: 0.07 },
    { recall: 0.62, precision: 0.07 },
    { recall: 0.7, precision: 0.06 },
    { recall: 0.8, precision: 0.05 },
    { recall: 0.9, precision: 0.04 },
    { recall: 1, precision: 0.03 },
  ],
  svm: [
    { recall: 0, precision: 1 },
    { recall: 0.1, precision: 0.95 },
    { recall: 0.2, precision: 0.91 },
    { recall: 0.3, precision: 0.87 },
    { recall: 0.4, precision: 0.84 },
    { recall: 0.5, precision: 0.81 },
    { recall: 0.6, precision: 0.78 },
    { recall: 0.7, precision: 0.75 },
    { recall: 0.74, precision: 0.74 },
    { recall: 0.8, precision: 0.70 },
    { recall: 0.85, precision: 0.64 },
    { recall: 0.9, precision: 0.55 },
    { recall: 1, precision: 0.38 },
  ],
  decisionTree: [
    { recall: 0, precision: 1 },
    { recall: 0.1, precision: 0.96 },
    { recall: 0.2, precision: 0.92 },
    { recall: 0.3, precision: 0.88 },
    { recall: 0.4, precision: 0.84 },
    { recall: 0.5, precision: 0.80 },
    { recall: 0.6, precision: 0.77 },
    { recall: 0.7, precision: 0.74 },
    { recall: 0.81, precision: 0.70 },
    { recall: 0.85, precision: 0.66 },
    { recall: 0.9, precision: 0.58 },
    { recall: 0.95, precision: 0.47 },
    { recall: 1, precision: 0.35 },
  ],
};

export const FEATURE_IMPORTANCE = [
  { feature: 'V14', importance: 0.142 },
  { feature: 'V4', importance: 0.128 },
  { feature: 'V10', importance: 0.115 },
  { feature: 'V12', importance: 0.098 },
  { feature: 'V17', importance: 0.087 },
  { feature: 'V3', importance: 0.076 },
  { feature: 'V11', importance: 0.065 },
  { feature: 'V16', importance: 0.054 },
  { feature: 'Amount', importance: 0.048 },
  { feature: 'V7', importance: 0.042 },
  { feature: 'V2', importance: 0.038 },
  { feature: 'V9', importance: 0.031 },
  { feature: 'V18', importance: 0.028 },
  { feature: 'V1', importance: 0.024 },
  { feature: 'V5', importance: 0.019 },
];

export const RADAR_DATA = [
  { metric: 'Accuracy', knn: 99.92, lr: 97.54, svm: 99.91, dt: 99.91, fullMark: 100 },
  { metric: 'Precision', knn: 85, lr: 9, svm: 82, dt: 75, fullMark: 100 },
  { metric: 'Recall', knn: 78, lr: 62, svm: 74, dt: 81, fullMark: 100 },
  { metric: 'F1 Score', knn: 81, lr: 16, svm: 78, dt: 78, fullMark: 100 },
  { metric: 'ROC-AUC', knn: 93, lr: 81, svm: 90, dt: 91, fullMark: 100 },
  { metric: 'PR-AUC', knn: 83, lr: 7, svm: 79, dt: 74, fullMark: 100 },
];

export const LIVE_TRANSACTIONS = [
  { id: 'TX-88421', time: '14:32:01', amount: 12.50, status: 'legitimate', confidence: 0.99 },
  { id: 'TX-88422', time: '14:32:15', amount: 89.99, status: 'legitimate', confidence: 0.98 },
  { id: 'TX-88423', time: '14:32:28', amount: 256.00, status: 'fraud', confidence: 0.94 },
  { id: 'TX-88424', time: '14:32:41', amount: 45.20, status: 'legitimate', confidence: 0.97 },
  { id: 'TX-88425', time: '14:32:55', amount: 1890.50, status: 'fraud', confidence: 0.91 },
  { id: 'TX-88426', time: '14:33:08', amount: 3.50, status: 'legitimate', confidence: 0.99 },
  { id: 'TX-88427', time: '14:33:22', amount: 1200.00, status: 'fraud', confidence: 0.88 },
  { id: 'TX-88428', time: '14:33:35', amount: 67.80, status: 'legitimate', confidence: 0.96 },
];

export const CONFUSION_MATRIX_KNN = [
  [56848, 14],
  [22, 78],
];

export const CONFUSION_MATRIX_LR = [
  [56254, 608],
  [38, 62],
];

export const CONFUSION_MATRIX_SVM = [
  [56846, 16],
  [26, 74],
];

export const CONFUSION_MATRIX_DT = [
  [56835, 27],
  [19, 81],
];

export const THRESHOLD_DATA = [
  { threshold: 0.1, precision: 0.45, recall: 0.98, f1: 0.62 },
  { threshold: 0.2, precision: 0.58, recall: 0.94, f1: 0.72 },
  { threshold: 0.3, precision: 0.68, recall: 0.90, f1: 0.77 },
  { threshold: 0.4, precision: 0.76, recall: 0.86, f1: 0.81 },
  { threshold: 0.5, precision: 0.82, recall: 0.82, f1: 0.82 },
  { threshold: 0.6, precision: 0.88, recall: 0.76, f1: 0.82 },
  { threshold: 0.7, precision: 0.92, recall: 0.68, f1: 0.78 },
  { threshold: 0.8, precision: 0.96, recall: 0.55, f1: 0.70 },
  { threshold: 0.9, precision: 0.99, recall: 0.38, f1: 0.55 },
];

export const TRAINING_HISTORY = [
  { epoch: 1, knn_loss: 0.85, lr_loss: 0.92, svm_loss: 0.78, dt_loss: 0.72 },
  { epoch: 2, knn_loss: 0.78, lr_loss: 0.88, svm_loss: 0.71, dt_loss: 0.65 },
  { epoch: 3, knn_loss: 0.72, lr_loss: 0.84, svm_loss: 0.65, dt_loss: 0.58 },
  { epoch: 4, knn_loss: 0.68, lr_loss: 0.80, svm_loss: 0.60, dt_loss: 0.52 },
  { epoch: 5, knn_loss: 0.64, lr_loss: 0.77, svm_loss: 0.56, dt_loss: 0.47 },
  { epoch: 6, knn_loss: 0.61, lr_loss: 0.74, svm_loss: 0.53, dt_loss: 0.43 },
  { epoch: 7, knn_loss: 0.59, lr_loss: 0.72, svm_loss: 0.51, dt_loss: 0.40 },
  { epoch: 8, knn_loss: 0.57, lr_loss: 0.70, svm_loss: 0.49, dt_loss: 0.38 },
  { epoch: 9, knn_loss: 0.56, lr_loss: 0.68, svm_loss: 0.48, dt_loss: 0.36 },
  { epoch: 10, knn_loss: 0.55, lr_loss: 0.67, svm_loss: 0.47, dt_loss: 0.35 },
];
