import numpy as np
from lstm_numpy import LSTMModel
from pymongo import MongoClient
from bson import ObjectId
import datetime
import os
import logging
from typing import List, Dict, Tuple, Optional
import json
from sklearn.preprocessing import MinMaxScaler
import joblib

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
MIN_TRAINING_MONTHS = 4
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

def get_user_categories(user_id: ObjectId) -> Dict[ObjectId, str]:
    """Fetch all categories for a user and map IDs to names"""
    categories = categories_collection.find({"user": user_id})
    return {cat["_id"]: cat["name"] for cat in categories}

def get_monthly_expenses(user_id: ObjectId) -> Tuple[List[Dict], List[str]]:
    """Fetch and aggregate monthly expenses by category"""
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
    
    # Collect all months and categories with activity
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
    
    # Organize data by month
    monthly_data = {}
    for record in results:
        year_month = (record["_id"]["year"], record["_id"]["month"])
        category_name = category_map[record["_id"]["category"]]
        
        if category_name not in active_categories:
            continue
            
        if year_month not in monthly_data:
            monthly_data[year_month] = {name: 0.0 for name in active_categories}
        
        monthly_data[year_month][category_name] = record["total"]
    
    # Convert to list in chronological order
    sorted_months = sorted(monthly_data.keys())
    return [monthly_data[month] for month in sorted_months], active_categories

def create_sequences(data: np.ndarray, window_size: int) -> Tuple[np.ndarray, np.ndarray]:
    """Create input-output sequences for training"""
    X, y = [], []
    for i in range(len(data) - window_size):
        X.append(data[i:i+window_size])
        y.append(data[i+window_size])
    return np.array(X), np.array(y)

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
        training_data = np.array([
            [month[cat] for cat in active_categories]
            for month in monthly_expenses
        ], dtype='float32')
        
        # 3. Scale data
        scaler = MinMaxScaler()
        scaled_data = scaler.fit_transform(training_data)
        
        # 4. Create sequences
        X, y = create_sequences(scaled_data, WINDOW_SIZE)
        
        # 5. Initialize and train LSTM
        lstm = LSTMModel(input_size=len(active_categories), hidden_size=64)
        lstm.train(X, y, epochs=100, learning_rate=0.01)
        
        # 6. Save artifacts
        lstm.save(f"{MODELS_DIR}/lstm_{user_id}.npz")
        joblib.dump(scaler, f"{MODELS_DIR}/scaler_{user_id}.pkl")
        
        # Save config
        config = {
            "user_id": str(user_id),
            "categories": active_categories,
            "updated_at": datetime.datetime.now().isoformat()
        }
        with open(f"{CONFIG_DIR}/config_{user_id}.json", 'w') as f:
            json.dump(config, f, indent=2)
        
        logger.info(f"Successfully trained model for {user_id}")
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