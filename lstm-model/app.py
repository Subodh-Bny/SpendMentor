from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from tensorflow.keras.models import load_model
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
MIN_PREDICTION_VALUE = 0.01  # Minimum allowed prediction value

# Initialize FastAPI with CORS
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def load_model_config(user_id: str) -> Optional[Dict]:
    """Load model configuration"""
    config_path = f"{CONFIG_DIR}/config_{user_id}.json"
    try:
        with open(config_path) as f:
            return json.load(f)
    except FileNotFoundError:
        logger.warning(f"No config found for user {user_id}")
        return None

def get_monthly_expenses(user_id: ObjectId, active_categories: List[str]) -> List[Dict]:
    """Fetch and validate monthly expenses"""
    category_map = {cat["name"]: cat["_id"] for cat in 
                   categories_collection.find({"user": user_id})}
    category_ids = [category_map[cat] for cat in active_categories 
                   if cat in category_map]
    
    if len(category_ids) != len(active_categories):
        missing = set(active_categories) - set(category_map.keys())
        raise ValueError(f"Missing categories: {missing}")

    end_date = datetime.datetime.now()
    start_date = end_date - datetime.timedelta(days=365)
    
    pipeline = [
        {
            "$match": {
                "user": user_id,
                "date": {"$gte": start_date},
                "category": {"$in": category_ids}
            }
        },
        {
            "$group": {
                "_id": {
                    "year": {"$year": "$date"},
                    "month": {"$month": "$date"},
                    "category": "$category"
                },
                "total": {"$sum": {"$toDouble": "$amount"}}
            }
        },
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
            monthly_data[year_month] = {name: MIN_PREDICTION_VALUE for name in active_categories}
        
        monthly_data[year_month][category_name] = amount
    
    sorted_months = sorted(monthly_data.keys())
    return [monthly_data[month] for month in sorted_months]

def prepare_prediction_input(data: List[Dict], active_categories: List[str]) -> np.ndarray:
    """Prepare input data for prediction"""
    arr = np.array([
        [month.get(cat, MIN_PREDICTION_VALUE) for cat in active_categories]
        for month in data
    ], dtype='float32')
    
    if len(arr) > WINDOW_SIZE:
        return arr[-WINDOW_SIZE:]
    elif len(arr) < WINDOW_SIZE:
        padding = np.full((WINDOW_SIZE - len(arr), len(active_categories)), MIN_PREDICTION_VALUE)
        return np.vstack([padding, arr])
    return arr

@app.post("/predict/{user_id}")
async def predict(user_id: str):
    try:
        user_oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    logger.info(f"Prediction request for user {user_id}")
    
    try:
        config = load_model_config(user_id)
        if not config:
            raise HTTPException(status_code=404, detail="Model not trained for this user")
        
        active_categories = config["categories"]
        monthly_expenses = get_monthly_expenses(user_oid, active_categories)
        
        if len(monthly_expenses) < MIN_REQUIRED_MONTHS:
            raise HTTPException(
                status_code=400,
                detail=f"Need at least {MIN_REQUIRED_MONTHS} months of data"
            )
        
        input_data = prepare_prediction_input(monthly_expenses, active_categories)
        
        try:
            model = load_model(f"{MODELS_DIR}/model_{user_id}.h5")
            scaler = joblib.load(f"{MODELS_DIR}/scaler_{user_id}.pkl")
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="Model files not found")
        
        scaled_input = scaler.transform(input_data)
        input_seq = scaled_input.reshape(1, WINDOW_SIZE, len(active_categories))
        
        prediction_scaled = model.predict(input_seq, verbose=0)[0]
        prediction = scaler.inverse_transform([prediction_scaled])[0]
        
        # Ensure non-negative predictions
        prediction = np.maximum(prediction, MIN_PREDICTION_VALUE)
        
        last_month = monthly_expenses[-1]
        percentage_changes = {
            cat: round(((prediction[i] - last_month[cat]) / last_month[cat]) * 100, 2)
            if last_month[cat] > MIN_PREDICTION_VALUE else 0.0
            for i, cat in enumerate(active_categories)
        }
        
        return {
            "user_id": user_id,
            "prediction_date": datetime.datetime.now().isoformat(),
            "categories": active_categories,
            "predicted_amounts": {
                cat: round(float(amount), 2)
                for cat, amount in zip(active_categories, prediction)
            },
            "last_month_values": {
                cat: round(float(last_month[cat]), 2)
                for cat in active_categories
            },
            "percentage_changes": percentage_changes,
            "based_on_months": len(monthly_expenses),
            "window_size": WINDOW_SIZE,
            "prediction_quality": {
                "has_negative_values": any(p < 0 for p in prediction_scaled),
                "corrected_values": any(p < MIN_PREDICTION_VALUE for p in prediction)
            }
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Prediction error")

@app.get("/model-status/{user_id}")
async def model_status(user_id: str):
    """Check model health and statistics"""
    try:
        user_oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    config = load_model_config(user_id)
    if not config:
        raise HTTPException(status_code=404, detail="Model not found")
    
    try:
        monthly_expenses = get_monthly_expenses(user_oid, config["categories"])
        input_data = prepare_prediction_input(monthly_expenses, config["categories"])
        
        model = load_model(f"{MODELS_DIR}/model_{user_id}.h5")
        scaler = joblib.load(f"{MODELS_DIR}/scaler_{user_id}.pkl")
        
        scaled_input = scaler.transform(input_data)
        prediction = model.predict(scaled_input.reshape(1, WINDOW_SIZE, len(config["categories"])))
        prediction = scaler.inverse_transform(prediction)[0]
        
        return {
            "status": "active",
            "last_trained": config["updated_at"],
            "prediction_stats": {
                "min": float(np.min(prediction)),
                "max": float(np.max(prediction)),
                "mean": float(np.mean(prediction)),
                "has_negatives": any(p < 0 for p in prediction)
            },
            "data_stats": {
                "months_available": len(monthly_expenses),
                "categories": config["categories"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.now().isoformat(),
        "models_ready": os.path.exists(MODELS_DIR),
        "configs_ready": os.path.exists(CONFIG_DIR)
    }

# MongoDB Connection (at end to ensure routes are defined first)
try:
    client = MongoClient("mongodb+srv://subodh_brushstroke:65nQOXyGwE5BNq1B@cluster0.dpqxvte.mongodb.net/SpendWise?retryWrites=true&w=majority&appName=Cluster0")
    db = client['SpendWise']
    expenses_collection = db['expenses']
    categories_collection = db['categories']
except Exception as e:
    logger.error(f"Failed to connect to MongoDB: {str(e)}")
    raise