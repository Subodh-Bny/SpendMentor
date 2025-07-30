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
from typing import List, Dict, Optional
import json

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
        "http://localhost:3000",  # Dev
        "https://your-frontend-domain.com"  # Production
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# ------------------- MONGODB ------------------- #
try:
    client = MongoClient("mongodb+srv://subodh_brushstroke:65nQOXyGwE5BNq1B@cluster0.dpqxvte.mongodb.net/SpendWise?retryWrites=true&w=majority&appName=Cluster0")
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

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.now().isoformat(),
        "models_ready": os.path.exists(MODELS_DIR),
        "configs_ready": os.path.exists(CONFIG_DIR)
    }
