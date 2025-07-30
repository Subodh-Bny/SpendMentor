from fastapi import FastAPI, HTTPException
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

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
MIN_REQUIRED_MONTHS = 6
WINDOW_SIZE = 6
MODELS_DIR = "./models"
CONFIG_DIR = "./model_configs"
MIN_PREDICTION_VALUE = 0.01
MIN_EXPENSE_VALUE = 0.01

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(CONFIG_DIR, exist_ok=True)

# Initialize FastAPI with CORS
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
try:
    client = MongoClient("mongodb+srv://subodh_brushstroke:65nQOXyGwE5BNq1B@cluster0.dpqxvte.mongodb.net/SpendWise?retryWrites=true&w=majority&appName=Cluster0")
    db = client['SpendWise']
    expenses_collection = db['expenses']
    categories_collection = db['categories']
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {str(e)}")
    raise


# ------------------- HELPER FUNCTIONS ------------------- #

def get_user_categories(user_id: ObjectId) -> Dict[ObjectId, str]:
    categories = categories_collection.find({"user": user_id})
    return {cat["_id"]: cat["name"] for cat in categories}

def get_monthly_expenses_training(user_id: ObjectId):
    """Fetch and process monthly expenses for training"""
    category_map = get_user_categories(user_id)
    if not category_map:
        return [], []

    end_date = datetime.datetime.now()
    start_date = end_date - datetime.timedelta(days=730)

    pipeline = [
        {"$match": {
            "user": user_id,
            "date": {"$gte": start_date},
            "category": {"$in": list(category_map.keys())}
        }},
        {"$group": {
            "_id": {"year": {"$year": "$date"}, "month": {"$month": "$date"}, "category": "$category"},
            "total": {"$sum": {"$toDouble": "$amount"}}
        }},
        {"$sort": {"_id.year": 1, "_id.month": 1}}
    ]
    results = list(expenses_collection.aggregate(pipeline))

    monthly_data = {}
    active_categories = list(category_map.values())
    id_to_name = {k: v for k, v in category_map.items()}

    for record in results:
        year_month = (record["_id"]["year"], record["_id"]["month"])
        category_name = id_to_name[record["_id"]["category"]]
        amount = max(float(record["total"]), MIN_EXPENSE_VALUE)

        if year_month not in monthly_data:
            monthly_data[year_month] = {name: MIN_EXPENSE_VALUE for name in active_categories}
        monthly_data[year_month][category_name] = amount

    sorted_months = sorted(monthly_data.keys())
    return [monthly_data[month] for month in sorted_months], active_categories

def prepare_training_data(monthly_expenses: List[Dict], categories: List[str]) -> np.ndarray:
    return np.array([
        [month.get(cat, MIN_EXPENSE_VALUE) for cat in categories]
        for month in monthly_expenses
    ], dtype='float32')

def save_model_config(user_id: ObjectId, categories: List[str]):
    config = {
        "user_id": str(user_id),
        "categories": categories,
        "updated_at": datetime.datetime.now().isoformat(),
        "min_expense_value": MIN_EXPENSE_VALUE,
        "window_size": WINDOW_SIZE
    }
    with open(f"{CONFIG_DIR}/config_{user_id}.json", 'w') as f:
        json.dump(config, f, indent=2)

# ------------------- TRAINING ------------------- #

def train_model_for_user(user_id: ObjectId) -> bool:
    try:
        logger.info(f"Training model for user {user_id}")
        monthly_expenses, categories = get_monthly_expenses_training(user_id)

        if len(monthly_expenses) < MIN_REQUIRED_MONTHS:
            logger.warning(f"Insufficient data for {user_id}")
            return False

        training_data = prepare_training_data(monthly_expenses, categories)
        scaler = MinMaxScaler(feature_range=(1, 2))
        scaled_data = scaler.fit_transform(training_data)

        X, y = [], []
        for i in range(len(scaled_data) - WINDOW_SIZE):
            X.append(scaled_data[i:i+WINDOW_SIZE])
            y.append(scaled_data[i+WINDOW_SIZE])
        X, y = np.array(X), np.array(y)

        model = Sequential([
            LSTM(128, activation='relu', return_sequences=True, input_shape=(WINDOW_SIZE, len(categories))),
            LSTM(64, activation='relu'),
            Dense(32, activation='relu'),
            Dense(len(categories), activation='relu')
        ])
        model.compile(optimizer=Adam(learning_rate=0.001), loss='mse', metrics=['mse'])

        model.fit(X, y, epochs=200, batch_size=16, callbacks=[EarlyStopping(monitor='loss', patience=15)], verbose=0)

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
    config_path = f"{CONFIG_DIR}/config_{user_id}.json"
    try:
        with open(config_path) as f:
            return json.load(f)
    except FileNotFoundError:
        return None

def get_monthly_expenses_prediction(user_id: ObjectId, categories: List[str]) -> List[Dict]:
    category_map = {cat["name"]: cat["_id"] for cat in categories_collection.find({"user": user_id})}
    category_ids = [category_map[cat] for cat in categories if cat in category_map]

    end_date = datetime.datetime.now()
    start_date = end_date - datetime.timedelta(days=365)

    pipeline = [
        {"$match": {"user": user_id, "date": {"$gte": start_date}, "category": {"$in": category_ids}}},
        {"$group": {"_id": {"year": {"$year": "$date"}, "month": {"$month": "$date"}, "category": "$category"}, "total": {"$sum": {"$toDouble": "$amount"}}}},
        {"$sort": {"_id.year": 1, "_id.month": 1}}
    ]
    results = list(expenses_collection.aggregate(pipeline))
    monthly_data = {}
    id_to_name = {v: k for k, v in category_map.items()}

    for record in results:
        year_month = (record["_id"]["year"], record["_id"]["month"])
        category_name = id_to_name[record["_id"]["category"]]
        amount = max(float(record["total"]), MIN_PREDICTION_VALUE)

        if year_month not in monthly_data:
            monthly_data[year_month] = {name: MIN_PREDICTION_VALUE for name in categories}
        monthly_data[year_month][category_name] = amount

    sorted_months = sorted(monthly_data.keys())
    return [monthly_data[month] for month in sorted_months]

def prepare_prediction_input(data: List[Dict], categories: List[str]) -> np.ndarray:
    arr = np.array([[month.get(cat, MIN_PREDICTION_VALUE) for cat in categories] for month in data], dtype='float32')
    if len(arr) > WINDOW_SIZE:
        return arr[-WINDOW_SIZE:]
    elif len(arr) < WINDOW_SIZE:
        padding = np.full((WINDOW_SIZE - len(arr), len(categories)), MIN_PREDICTION_VALUE)
        return np.vstack([padding, arr])
    return arr


@app.post("/predict/{user_id}")
async def predict(user_id: str):
    try:
        user_oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    trained = train_model_for_user(user_oid)
    if not trained:
        raise HTTPException(status_code=400, detail="Model training failed or insufficient data")

    config = load_model_config(user_id)
    if not config:
        raise HTTPException(status_code=404, detail="Model config not found")

    categories = config["categories"]
    monthly_expenses = get_monthly_expenses_prediction(user_oid, categories)

    if len(monthly_expenses) < MIN_REQUIRED_MONTHS:
        raise HTTPException(status_code=400, detail=f"Need at least {MIN_REQUIRED_MONTHS} months of data")

    input_data = prepare_prediction_input(monthly_expenses, categories)
    model = load_model(f"{MODELS_DIR}/model_{user_id}.h5")
    scaler = joblib.load(f"{MODELS_DIR}/scaler_{user_id}.pkl")

    scaled_input = scaler.transform(input_data)
    prediction_scaled = model.predict(scaled_input.reshape(1, WINDOW_SIZE, len(categories)), verbose=0)[0]
    prediction = scaler.inverse_transform([prediction_scaled])[0]
    prediction = np.maximum(prediction, MIN_PREDICTION_VALUE)

    last_month = monthly_expenses[-1]
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


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.now().isoformat(),
        "models_ready": os.path.exists(MODELS_DIR),
        "configs_ready": os.path.exists(CONFIG_DIR)
    }
