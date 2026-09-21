from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from tensorflow.keras.models import Sequential, load_model
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.optimizers import Adam
from sklearn.preprocessing import MinMaxScaler
from pymongo import MongoClient
from bson import ObjectId
import numpy as np
import joblib
import datetime
import os
import logging
from typing import List, Dict, Optional, Tuple
from pydantic import BaseModel, Field
import json
import math
import time

# ------------------- LOGGING ------------------- #
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ------------------- CONSTANTS ------------------- #
MIN_REQUIRED_MONTHS = 12
WINDOW_SIZE = 6
MODELS_DIR = "./models"
CONFIG_DIR = "./model_configs"
MIN_PREDICTION_VALUE = 0.01
MIN_EXPENSE_VALUE = 0.01

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(CONFIG_DIR, exist_ok=True)

# ------------------- FASTAPI INIT ------------------- #
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
       "*" # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# ------------------- MONGODB ------------------- #
try:
    client = MongoClient("mongodb://subodh_brushstroke:65nQOXyGwE5BNq1B@ac-7ajjmln-shard-00-00.dpqxvte.mongodb.net:27017,ac-7ajjmln-shard-00-01.dpqxvte.mongodb.net:27017,ac-7ajjmln-shard-00-02.dpqxvte.mongodb.net:27017/SpendWise?ssl=true&authSource=admin&replicaSet=atlas-thk0nk-shard-0&retryWrites=true&w=majority&appName=Cluster0")
    db = client['SpendWise']
    expenses_collection = db['expenses']
    categories_collection = db['categories']
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {str(e)}")
    raise

# ------------------- HELPERS ------------------- #
def get_user_categories(user_id: ObjectId) -> Dict[ObjectId, str]:
    categories = categories_collection.find({"user": user_id})
    return {cat["_id"]: cat["name"] for cat in categories}

def get_monthly_expenses(user_id: ObjectId, training: bool = True, categories: List[str] = None):
    category_map = get_user_categories(user_id)
    if not category_map:
        return [], []

    end_date = datetime.datetime.now()
    start_date = end_date - datetime.timedelta(days=730 if training else 365)

    pipeline = [
        {"$match": {"user": user_id, "date": {"$gte": start_date}, "category": {"$in": list(category_map.keys())}}},
        {"$group": {"_id": {"year": {"$year": "$date"}, "month": {"$month": "$date"}, "category": "$category"},
                    "total": {"$sum": {"$toDouble": "$amount"}}}},
        {"$sort": {"_id.year": 1, "_id.month": 1}}
    ]
    results = list(expenses_collection.aggregate(pipeline))

    monthly_data = {}
    active_categories = list(category_map.values())
    id_to_name = {k: v for k, v in category_map.items()}

    for record in results:
        ym = (record["_id"]["year"], record["_id"]["month"])
        category_name = id_to_name[record["_id"]["category"]]
        amount = max(float(record["total"]), MIN_EXPENSE_VALUE)
        if ym not in monthly_data:
            monthly_data[ym] = {name: MIN_EXPENSE_VALUE for name in active_categories}
        monthly_data[ym][category_name] = amount

    sorted_months = sorted(monthly_data.keys())
    return [monthly_data[month] for month in sorted_months], active_categories

def prepare_data(data: List[Dict], categories: List[str]) -> np.ndarray:
    return np.array([[month.get(cat, MIN_EXPENSE_VALUE) for cat in categories] for month in data], dtype='float32')

def save_model_config(user_id: ObjectId, categories: List[str]):
    config = {
        "user_id": str(user_id),
        "categories": categories,
        "updated_at": datetime.datetime.now().isoformat(),
        "window_size": WINDOW_SIZE
    }
    with open(f"{CONFIG_DIR}/config_{user_id}.json", 'w') as f:
        json.dump(config, f, indent=2)

# ------------------- TRAINING ------------------- #
def train_model_for_user(user_id: ObjectId) -> bool:
    try:
        logger.info(f"Training model for user {user_id}")
        monthly_expenses, categories = get_monthly_expenses(user_id, training=True)
        if len(monthly_expenses) < MIN_REQUIRED_MONTHS:
            logger.warning(f"Insufficient data for {user_id}")
            return False

        training_data = prepare_data(monthly_expenses, categories)
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_data = scaler.fit_transform(training_data)

        X, y = [], []
        for i in range(len(scaled_data) - WINDOW_SIZE):
            X.append(scaled_data[i:i+WINDOW_SIZE])
            y.append(scaled_data[i+WINDOW_SIZE])
        X, y = np.array(X), np.array(y)

        model = Sequential([
            LSTM(128, activation='tanh', return_sequences=True, input_shape=(WINDOW_SIZE, len(categories))),
            LSTM(64, activation='tanh'),
            Dense(32, activation='relu'),
            Dense(len(categories), activation='linear')
        ])
        model.compile(optimizer=Adam(learning_rate=0.001), loss='mse', metrics=['mse'])

        model.fit(
            X, y,
            epochs=100,
            batch_size=16,
            validation_split=0.2,
            callbacks=[EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True)],
            verbose=0
        )

        model.save(f"{MODELS_DIR}/model_{user_id}.h5")
        joblib.dump(scaler, f"{MODELS_DIR}/scaler_{user_id}.pkl")
        save_model_config(user_id, categories)
        logger.info(f"Model training completed for {user_id}")
        return True
    except Exception as e:
        logger.error(f"Training failed: {str(e)}", exc_info=True)
        return False

# ------------------- PREDICTION ------------------- #
def load_model_config(user_id: str) -> Optional[Dict]:
    path = f"{CONFIG_DIR}/config_{user_id}.json"
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return None

@app.post("/predict/{user_id}")
async def predict(user_id: str):
    try:
        user_oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    config = load_model_config(user_id)
    if not config:
        raise HTTPException(status_code=404, detail="Model not found")

    categories = config["categories"]
    monthly_expenses, _ = get_monthly_expenses(user_oid, training=False, categories=categories)
    if len(monthly_expenses) < MIN_REQUIRED_MONTHS:
        raise HTTPException(status_code=400, detail=f"Need at least {MIN_REQUIRED_MONTHS} months of data")

    input_data = prepare_data(monthly_expenses, categories)
    if len(input_data) < WINDOW_SIZE:
        padding = np.full((WINDOW_SIZE - len(input_data), len(categories)), MIN_PREDICTION_VALUE)
        input_data = np.vstack([padding, input_data])
    else:
        input_data = input_data[-WINDOW_SIZE:]

    model = load_model(f"{MODELS_DIR}/model_{user_id}.h5")
    scaler = joblib.load(f"{MODELS_DIR}/scaler_{user_id}.pkl")
    scaled_input = scaler.transform(input_data)
    prediction_scaled = model.predict(scaled_input.reshape(1, WINDOW_SIZE, len(categories)), verbose=0)[0]
    prediction = scaler.inverse_transform([prediction_scaled])[0]

    # Smooth prediction with last month
    last_month = monthly_expenses[-1]
    prediction = 0.7 * np.array([last_month[cat] for cat in categories]) + 0.3 * prediction
    prediction = np.maximum(prediction, MIN_PREDICTION_VALUE)

    percentage_changes = {
        cat: round(((prediction[i] - last_month[cat]) / last_month[cat]) * 100, 2)
        if last_month[cat] > MIN_PREDICTION_VALUE else 0.0
        for i, cat in enumerate(categories)
    }

    return {
        "user_id": user_id,
        "prediction_date": datetime.datetime.now().isoformat(),
        "categories": categories,
        "predicted_amounts": {cat: round(float(amount), 2) for cat, amount in zip(categories, prediction)},
        "last_month_values": {cat: round(float(last_month[cat]), 2) for cat in categories},
        "percentage_changes": percentage_changes,
        "based_on_months": MIN_REQUIRED_MONTHS,
        "window_size": WINDOW_SIZE
    }

@app.post("/train/{user_id}")
async def train_endpoint(user_id: str, background_tasks: BackgroundTasks):
    try:
        user_oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    background_tasks.add_task(train_model_for_user, user_oid)
    return {"status": "training_started", "user_id": user_id}

# ==============================================================================
# 1. PYDANTIC SCHEMAS (DATA CONTRACTS)
# ==============================================================================

class ExpenseItem(BaseModel):
    id: str = Field(..., description="Unique identifier of the expense")
    name: str = Field(..., description="Name or description of the expense item")
    amount: float = Field(..., gt=0, description="Cost of the expense (weight in knapsack)")
    priority_score: int = Field(
        ...,
        ge=1,
        le=100,
        description="Cut priority or non-essential value score (value in knapsack, higher = better to cut)",
    )

class OptimizeBudgetRequest(BaseModel):
    target_savings: float = Field(
        ...,
        gt=0,
        description="Target savings amount to cut without exceeding (Knapsack capacity W)",
    )
    expenses: List[ExpenseItem] = Field(
        ...,
        min_length=1,
        description="List of candidate non-essential expenses to consider cutting",
    )

class DPExecutionDetails(BaseModel):
    capacity_w: int
    num_items: int
    dp_matrix_shape: str
    time_complexity: str
    space_complexity: str
    execution_time_ms: float
    mathematical_recurrence: str

class OptimizeBudgetResponse(BaseModel):
    recommended_cuts: List[ExpenseItem]
    total_saved_amount: float
    total_priority_score: int
    target_savings: float
    execution_details: DPExecutionDetails

class TransactionItem(BaseModel):
    id: str = Field(..., description="Unique transaction ID")
    amount: float = Field(..., gt=0, description="Monetary value of the transaction")
    description: Optional[str] = Field(None, description="Optional transaction label")

class AnomalyDetectionRequest(BaseModel):
    transactions: List[TransactionItem] = Field(
        ...,
        min_length=3,
        description="Historical user transactions (at least 3 required for statistical significance)",
    )
    threshold_z: float = Field(
        default=2.5,
        ge=1.0,
        le=4.0,
        description="Z-Score threshold to flag an outlier (Standard: 2.5 to 3.0)",
    )

class FlaggedTransaction(BaseModel):
    id: str
    amount: float
    z_score: float
    confidence_score: float = Field(
        ...,
        description="Outlier severity confidence score scaled between 0.0 and 1.0",
    )
    deviation_from_mean: float

class StatisticalSummary(BaseModel):
    mean: float
    standard_deviation: float
    variance: float
    total_transactions_analyzed: int
    total_anomalies_detected: int

class AnomalyDetectionResponse(BaseModel):
    flagged_transactions: List[FlaggedTransaction]
    statistical_summary: StatisticalSummary
    formula_used: str

# ==============================================================================
# 2. CORE ALGORITHMIC FUNCTIONS
# ==============================================================================

def solve_01_knapsack(
    items: List[ExpenseItem],
    capacity: float,
    scale_factor: int = 1,
) -> Tuple[List[ExpenseItem], int, float, dict]:
    start_time = time.perf_counter()
    scaled_capacity = int(round(capacity * scale_factor))
    n = len(items)

    weights = [int(round(item.amount * scale_factor)) for item in items]
    values = [item.priority_score for item in items]

    dp = [[0] * (scaled_capacity + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        item_weight = weights[i - 1]
        item_val = values[i - 1]
        for w in range(scaled_capacity + 1):
            if item_weight <= w:
                dp[i][w] = max(dp[i - 1][w], dp[i - 1][w - item_weight] + item_val)
            else:
                dp[i][w] = dp[i - 1][w]

    selected_items: List[ExpenseItem] = []
    w = scaled_capacity
    for i in range(n, 0, -1):
        if dp[i][w] != dp[i - 1][w]:
            selected_items.append(items[i - 1])
            w -= weights[i - 1]

    selected_items.reverse()
    total_saved = sum(item.amount for item in selected_items)
    max_priority = dp[n][scaled_capacity]
    execution_time_ms = (time.perf_counter() - start_time) * 1000

    metadata = {
        "capacity_w": scaled_capacity,
        "num_items": n,
        "dp_matrix_shape": f"{n + 1} x {scaled_capacity + 1}",
        "time_complexity": "O(n * W)",
        "space_complexity": "O(n * W)",
        "execution_time_ms": round(execution_time_ms, 4),
        "mathematical_recurrence": "DP[i][w] = max(DP[i-1][w], DP[i-1][w - w[i]] + v[i])",
    }

    return selected_items, max_priority, total_saved, metadata

def compute_z_score_anomalies(
    transactions: List[TransactionItem],
    threshold_z: float = 2.5,
) -> Tuple[List[FlaggedTransaction], StatisticalSummary]:
    n = len(transactions)
    amounts = [t.amount for t in transactions]

    mean = sum(amounts) / n
    variance = sum((x - mean) ** 2 for x in amounts) / n
    std_dev = math.sqrt(variance)

    flagged: List[FlaggedTransaction] = []

    if std_dev > 1e-9:
        for tx in transactions:
            z = (tx.amount - mean) / std_dev
            if z > threshold_z:
                confidence = min(1.0, 0.5 + ((z - threshold_z) / (threshold_z * 2)))
                flagged.append(
                    FlaggedTransaction(
                        id=tx.id,
                        amount=tx.amount,
                        z_score=round(z, 4),
                        confidence_score=round(confidence, 4),
                        deviation_from_mean=round(tx.amount - mean, 2),
                    )
                )

    summary = StatisticalSummary(
        mean=round(mean, 2),
        standard_deviation=round(std_dev, 2),
        variance=round(variance, 2),
        total_transactions_analyzed=n,
        total_anomalies_detected=len(flagged),
    )

    return flagged, summary

# ==============================================================================
# 3. FASTAPI REST ROUTERS
# ==============================================================================

@app.post("/api/v1/optimize-budget", response_model=OptimizeBudgetResponse)
async def optimize_budget(payload: OptimizeBudgetRequest):
    try:
        recommended_cuts, total_priority, total_saved, meta = solve_01_knapsack(
            items=payload.expenses,
            capacity=payload.target_savings,
            scale_factor=1,
        )

        return OptimizeBudgetResponse(
            recommended_cuts=recommended_cuts,
            total_saved_amount=round(total_saved, 2),
            total_priority_score=total_priority,
            target_savings=payload.target_savings,
            execution_details=DPExecutionDetails(**meta),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Knapsack computation error: {str(exc)}")

@app.post("/api/v1/detect-anomalies", response_model=AnomalyDetectionResponse)
async def detect_anomalies(payload: AnomalyDetectionRequest):
    try:
        flagged, summary = compute_z_score_anomalies(
            transactions=payload.transactions,
            threshold_z=payload.threshold_z,
        )

        return AnomalyDetectionResponse(
            flagged_transactions=flagged,
            statistical_summary=summary,
            formula_used="Z = (X - μ) / σ; flagged where Z > threshold_z",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Anomaly detection error: {str(exc)}")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.now().isoformat(),
        "models_ready": os.path.exists(MODELS_DIR),
        "configs_ready": os.path.exists(CONFIG_DIR)
    }
