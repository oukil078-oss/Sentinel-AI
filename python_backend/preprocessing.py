
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE

def preprocess_data(df):
    """
    Standard preprocessing for credit card fraud dataset.
    - Scales 'Amount' and 'Time'
    - Splits into Train/Test
    - Applies SMOTE to training data only
    """
    # Scaling
    scaler = StandardScaler()
    df['scaled_amount'] = scaler.fit_transform(df['Amount'].values.reshape(-1,1))
    df['scaled_time'] = scaler.fit_transform(df['Time'].values.reshape(-1,1))
    
    df.drop(['Time', 'Amount'], axis=1, inplace=True)
    
    # Feature/Target split
    X = df.drop('Class', axis=1)
    y = df['Class']
    
    # Stratified Train-Test Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # SMOTE only on training data
    sm = SMOTE(random_state=42)
    X_train_res, y_train_res = sm.fit_resample(X_train, y_train)
    
    return X_train_res, X_test, y_train_res, y_test, scaler
