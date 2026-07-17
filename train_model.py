import pandas as pd
import joblib
import os
import time

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline

print("🚀 Starting ML Training...\n")

# ======================================================
# 1️⃣ LOAD DATA
# ======================================================

if not os.path.exists("training_data.csv"):
    raise FileNotFoundError("training_data.csv not found")

df = pd.read_csv("training_data.csv")

print(f"✅ Records loaded: {len(df)}")

df.drop_duplicates(inplace=True)
df.dropna(inplace=True)

if len(df) < 100:
    raise ValueError("Dataset too small")

# ======================================================
# 2️⃣ FEATURE SELECTION (NO LEAKAGE)
# ======================================================

feature_columns = [
    "state",
    "age",
    "gender",
    "caste",
    "residential",
    "annual_salary",
    "occupation",
    "minority",
    "marital_status",
    "disability",
    "scheme_category"
]

X = df[feature_columns]
y = df["selected"]

print("\n🎯 Target Distribution:")
print(y.value_counts(normalize=True))

# ======================================================
# 3️⃣ DEFINE COLUMN TYPES
# ======================================================

categorical_cols = X.select_dtypes(include=["object"]).columns.tolist()
numerical_cols = X.select_dtypes(exclude=["object"]).columns.tolist()

print("\n🧠 Categorical Columns:", categorical_cols)
print("🔢 Numerical Columns:", numerical_cols)

# ======================================================
# 4️⃣ PREPROCESSING
# ======================================================

preprocessor = ColumnTransformer(
    transformers=[
        ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_cols),
        ("num", "passthrough", numerical_cols)
    ]
)

# ======================================================
# 5️⃣ PIPELINE
# ======================================================

pipeline = Pipeline(steps=[
    ("preprocessor", preprocessor),
    ("classifier", RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_leaf=5,
        class_weight="balanced",
        n_jobs=-1,
        random_state=42
    ))
])

# ======================================================
# 6️⃣ TRAIN TEST SPLIT
# ======================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    stratify=y,
    random_state=42
)

print("\n🌲 Training Model...")

start = time.time()

pipeline.fit(X_train, y_train)

end = time.time()

print(f"✅ Training completed in {round(end-start,2)} seconds")

# ======================================================
# 7️⃣ EVALUATION
# ======================================================

y_pred = pipeline.predict(X_test)

accuracy = accuracy_score(y_test, y_pred)

print(f"\n🎯 Accuracy: {round(accuracy*100,2)}%")
print("\n📋 Classification Report:\n")
print(classification_report(y_test, y_pred))

# ======================================================
# 8️⃣ SAVE MODEL
# ======================================================

joblib.dump(pipeline, "scheme_model.pkl")

print("\n💾 scheme_model.pkl saved successfully")
print("🎉 Training Complete!")