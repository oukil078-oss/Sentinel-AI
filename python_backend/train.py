
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from preprocessing import preprocess_data
import kagglehub

def main():
    # 1. Load Dataset
    print("Loading dataset from Kaggle...")
    df = kagglehub.load_dataset("mlg-ulb/creditcardfraud")
    
    # 2. Preprocess
    print("Preprocessing and applying SMOTE...")
    X_train, X_test, y_train, y_test, scaler = preprocess_data(df)
    
    # 3. Train Random Forest
    print("Training Random Forest (this may take a few minutes)...")
    rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)
    
    # 4. Train KNN
    print("Training KNN...")
    knn = KNeighborsClassifier(n_neighbors=5)
    knn.fit(X_train, y_train)
    
    # 5. Evaluate
    models = {'Random Forest': rf, 'KNN': knn}
    for name, model in models.items():
        preds = model.predict(X_test)
        print(f"\n--- {name} Results ---")
        print(classification_report(y_test, preds))
        print(f"ROC AUC: {roc_auc_score(y_test, preds):.4f}")
    
    # 6. Save Models
    print("\nSaving models...")
    joblib.dump(rf, 'models/rf_model.pkl')
    joblib.dump(knn, 'models/knn_model.pkl')
    joblib.dump(scaler, 'models/scaler.pkl')
    print("Done!")

if __name__ == "__main__":
    main()
