from fastapi import FastAPI, HTTPException
from tensorflow.keras.models import load_model  
from fastapi.middleware.cors import CORSMiddleware
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
MIN_REQUIRED_MONTHS = 4
WINDOW_SIZE = 3
MODELS_DIR = "./models"
CONFIG_DIR = "./model_configs"

# Create directories if they don't exist
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(CONFIG_DIR, exist_ok=True)

# MongoDB Connection
client = MongoClient("mongodb+srv://subodh_brushstroke:65nQOXyGwE5BNq1B@cluster0.dpqxvte.mongodb.net/SpendWise?retryWrites=true&w=majority&appName=Cluster0")
db = client['SpendWise']
expenses_collection = db['expenses']
categories_collection = db['categories']

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],  
)

def load_model_config(user_id: str) -> Optional[Dict]:
    """Load the category configuration for a user's model"""
    config_path = f"{CONFIG_DIR}/config_{user_id}.json"
    try:
        with open(config_path) as f:
            return json.load(f)
    except FileNotFoundError:
        logger.warning(f"No config found for user {user_id}")
        return None

def get_monthly_expenses(user_id: ObjectId, active_categories: List[str]) -> List[Dict]:
    """Fetch and aggregate monthly expenses for the user's active categories"""
    # Get category name to ID mapping
    category_map = {cat["name"]: cat["_id"] for cat in categories_collection.find({"user": user_id})}
    category_ids = [category_map[cat] for cat in active_categories if cat in category_map]
    
    if len(category_ids) != len(active_categories):
        missing = set(active_categories) - set(category_map.keys())
        raise ValueError(f"Missing categories: {missing}")

    # Get last 6 months of data
    end_date = datetime.datetime.now()
    start_date = end_date - datetime.timedelta(days=180)
    
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
    
    # Organize by month
    monthly_data = {}
    id_to_name = {v: k for k, v in category_map.items()}
    
    for record in results:
        year_month = (record["_id"]["year"], record["_id"]["month"])
        category_name = id_to_name[record["_id"]["category"]]
        
        if year_month not in monthly_data:
            monthly_data[year_month] = {name: 0.0 for name in active_categories}
        
        monthly_data[year_month][category_name] = record["total"]
    
    # Convert to list in chronological order
    sorted_months = sorted(monthly_data.keys())
    return [monthly_data[month] for month in sorted_months]

@app.get("/predict/{user_id}")
async def predict(user_id: str):
    try:
        user_oid = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID format")
    
    logger.info(f"Prediction request for user {user_id}")
    
    try:
        # 1. Load model configuration
        config = load_model_config(user_id)
        if not config:
            raise HTTPException(
                status_code=404,
                detail="Model not trained for this user. Please train first."
            )
        
        active_categories = config["categories"]
        
        # 2. Get and validate data
        monthly_expenses = get_monthly_expenses(user_oid, active_categories)
        if len(monthly_expenses) < MIN_REQUIRED_MONTHS:
            raise HTTPException(
                status_code=400,
                detail=f"Need at least {MIN_REQUIRED_MONTHS} months of data, got {len(monthly_expenses)}"
            )
        
        # 3. Prepare input data
        input_data = np.array([
            [month[cat] for cat in active_categories]
            for month in monthly_expenses
        ], dtype='float32')[-WINDOW_SIZE:]  # Take most recent WINDOW_SIZE months
        
        # 4. Load model and scaler
        try:
            model = load_model(f"{MODELS_DIR}/model_{user_id}.h5")  # Now properly imported
            scaler = joblib.load(f"{MODELS_DIR}/scaler_{user_id}.pkl")
        except FileNotFoundError:
            raise HTTPException(
                status_code=404,
                detail="Model files not found. Please retrain model."
            )
        
        # 5. Scale and predict
        scaled_input = scaler.transform(input_data)
        input_seq = scaled_input.reshape(1, WINDOW_SIZE, len(active_categories))
        
        prediction_scaled = model.predict(input_seq, verbose=0)[0]
        prediction = scaler.inverse_transform([prediction_scaled])[0]
        
        # 6. Format response
        return {
            "user_id": user_id,
            "prediction_date": datetime.datetime.now().isoformat(),
            "categories": active_categories,
            "predicted_amounts": {
                cat: round(float(amount), 2)
                for cat, amount in zip(active_categories, prediction)
            },
            "based_on_months": len(monthly_expenses)
        }
        
    except HTTPException:
        raise
    except ValueError as e:
        logger.error(f"Data validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="An error occurred during prediction"
        )

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.now().isoformat(),
        "model_ready": os.path.exists(MODELS_DIR)
    }