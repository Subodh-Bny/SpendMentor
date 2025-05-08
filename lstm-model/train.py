import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.callbacks import EarlyStopping
from sklearn.preprocessing import MinMaxScaler
from pymongo import MongoClient
from bson import ObjectId
import datetime
import joblib
import os
import logging
from typing import List, Dict, Tuple, Optional
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
MIN_TRAINING_MONTHS = 4  # Minimum months needed for training
WINDOW_SIZE = 3          # Historical months used for prediction
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

def get_user_categories(user_id: ObjectId) -> Dict[ObjectId, str]:
    """Fetch all categories for a user and map IDs to names"""
    categories = categories_collection.find({"user": user_id})
    return {cat["_id"]: cat["name"] for cat in categories}

def get_monthly_expenses(user_id: ObjectId) -> Tuple[List[Dict], List[str]]:
    """
    Fetch and aggregate monthly expenses by category.
    Returns:
    - monthly_data: List of monthly expense records
    - active_categories: Sorted list of categories with sufficient activity
    """
    # Get all of the user's categories
    category_map = get_user_categories(user_id)
    if not category_map:
        logger.warning(f"No categories found for user {user_id}")
        return [], []
    
    # Get expenses for last 2 years
    end_date = datetime.datetime.now()
    start_date = end_date - datetime.timedelta(days=730)
    
    pipeline = [
        {
            "$match": {
                "user": user_id,
                "date": {"$gte": start_date},
                "category": {"$in": list(category_map.keys())}
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
    
    # First pass: Collect all months and categories with activity
    all_months = set()
    category_activity = {name: 0 for name in category_map.values()}
    
    for record in results:
        year_month = (record["_id"]["year"], record["_id"]["month"])
        all_months.add(year_month)
        category_name = category_map[record["_id"]["category"]]
        category_activity[category_name] += 1
    
    # Determine active categories (appearing in at least 50% of months)
    min_occurrences = len(all_months) * 0.5
    active_categories = sorted([
        name for name, count in category_activity.items() 
        if count >= min_occurrences
    ])
    
    if not active_categories:
        logger.warning(f"No active categories found for user {user_id}")
        return [], []
    
    # Second pass: Organize data by month
    monthly_data = {}
    for record in results:
        year_month = (record["_id"]["year"], record["_id"]["month"])
        category_name = category_map[record["_id"]["category"]]
        
        # Only include active categories
        if category_name not in active_categories:
            continue
            
        if year_month not in monthly_data:
            monthly_data[year_month] = {name: 0.0 for name in active_categories}
        
        monthly_data[year_month][category_name] = record["total"]
    
    # Convert to list in chronological order
    sorted_months = sorted(monthly_data.keys())
    return [monthly_data[month] for month in sorted_months], active_categories

def prepare_training_data(monthly_expenses: List[Dict], active_categories: List[str]) -> np.ndarray:
    """Convert to numpy array with consistent category order"""
    return np.array([
        [month.get(category, 0.0) for category in active_categories]
        for month in monthly_expenses
    ], dtype='float32')

def save_model_config(user_id: ObjectId, active_categories: List[str]):
    """Save the category configuration for this user's model"""
    config = {
        "user_id": str(user_id),
        "categories": active_categories,
        "updated_at": datetime.datetime.now().isoformat()
    }
    
    config_path = f"{CONFIG_DIR}/config_{user_id}.json"
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)

def train_model_for_user(user_id: ObjectId) -> bool:
    """Complete training pipeline for a single user"""
    try:
        logger.info(f"Starting training for user {user_id}")
        
        # 1. Get and validate data
        monthly_expenses, active_categories = get_monthly_expenses(user_id)
        if len(monthly_expenses) < MIN_TRAINING_MONTHS:
            logger.warning(f"Insufficient data for {user_id}: {len(monthly_expenses)} months")
            return False
        if len(active_categories) < 1:
            logger.warning(f"No active categories for {user_id}")
            return False
            
        # 2. Prepare training data
        training_data = prepare_training_data(monthly_expenses, active_categories)
        
        # 3. Scale data and create sequences
        scaler = MinMaxScaler()
        scaled_data = scaler.fit_transform(training_data)
        
        X, y = [], []
        for i in range(len(scaled_data) - WINDOW_SIZE):
            X.append(scaled_data[i:i+WINDOW_SIZE])
            y.append(scaled_data[i+WINDOW_SIZE])
        X, y = np.array(X), np.array(y)
        
        # 4. Train model (dynamic input/output sizes based on categories)
        model = Sequential([
            LSTM(64, activation='relu', input_shape=(WINDOW_SIZE, len(active_categories))),
            Dense(len(active_categories))
        ])
        model.compile(optimizer='adam', loss='mse')
        
        model.fit(
            X, y,
            epochs=100,
            batch_size=8,
            callbacks=[EarlyStopping(monitor='loss', patience=10)],
            verbose=1
        )
        
        # 5. Save artifacts
        model.save(f"{MODELS_DIR}/model_{user_id}.h5")
        joblib.dump(scaler, f"{MODELS_DIR}/scaler_{user_id}.pkl")
        save_model_config(user_id, active_categories)
        
        logger.info(f"Successfully trained model for {user_id} with categories: {active_categories}")
        return True
        
    except Exception as e:
        logger.error(f"Error training for {user_id}: {str(e)}", exc_info=True)
        return False

def train_models():
    """Train models for all users with sufficient data"""
    user_ids = expenses_collection.distinct("user")
    logger.info(f"Found {len(user_ids)} users to process")
    
    success_count = 0
    for user_id in user_ids:
        if train_model_for_user(user_id):
            success_count += 1
    
    logger.info(f"Training complete. Successful models: {success_count}/{len(user_ids)}")

if __name__ == "__main__":
    train_models()