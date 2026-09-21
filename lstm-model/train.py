import numpy as np  # pyright: ignore[reportMissingImports]
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from tensorflow.keras.callbacks import Callback, EarlyStopping
from tensorflow.keras.optimizers import Adam
from sklearn.preprocessing import MinMaxScaler
from pymongo import MongoClient
from bson import ObjectId
import datetime
import joblib
import os
import logging
from typing import List, Dict, Tuple, Optional
import json
import csv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
MIN_TRAINING_MONTHS = 6
WINDOW_SIZE = 6
MODELS_DIR = "./models"
CONFIG_DIR = "./model_configs"
TRAINING_LOGS_DIR = "./training_logs"
MIN_EXPENSE_VALUE = 0.01  # Minimum valid expense amount

# Create directories
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(CONFIG_DIR, exist_ok=True)
os.makedirs(TRAINING_LOGS_DIR, exist_ok=True)

# MongoDB Connection
client = MongoClient("mongodb://subodh_brushstroke:65nQOXyGwE5BNq1B@ac-7ajjmln-shard-00-00.dpqxvte.mongodb.net:27017,ac-7ajjmln-shard-00-01.dpqxvte.mongodb.net:27017,ac-7ajjmln-shard-00-02.dpqxvte.mongodb.net:27017/SpendWise?ssl=true&authSource=admin&replicaSet=atlas-thk0nk-shard-0&retryWrites=true&w=majority&appName=Cluster0")
db = client['SpendWise']
expenses_collection = db['expenses']
categories_collection = db['categories']

class TrainingLogger(Callback):
    """Custom callback to log training metrics per epoch"""
    def __init__(self, user_id):
        super().__init__()
        self.user_id = user_id
        self.epoch_data = []
        self.log_file = f"{TRAINING_LOGS_DIR}/training_{user_id}.csv"
        
        # Write header if file doesn't exist
        if not os.path.exists(self.log_file):
            with open(self.log_file, 'w', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(['epoch', 'loss', 'mse'])

    def on_epoch_end(self, epoch, logs=None):
        logs = logs or {}
        epoch_data = {
            'epoch': epoch + 1,
            'loss': logs.get('loss'),
            'mse': logs.get('mse')  # Since we're using MSE as loss
        }
        self.epoch_data.append(epoch_data)
        
        # Append to CSV file
        with open(self.log_file, 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerow([
                epoch + 1,
                logs.get('loss', ''),
                logs.get('mse', '')
            ])
        
        logger.info(f"Epoch {epoch + 1} - loss: {logs.get('loss'):.4f} - mse: {logs.get('mse', ''):.4f}")

def validate_expense_data(data: List[Dict]) -> bool:
    """Validate expense data meets quality standards"""
    for record in data:
        for cat, amount in record.items():
            if amount < 0:
                logger.warning(f"Negative value found: {amount} for {cat}")
                return False
            if np.isnan(amount):
                logger.warning("NaN value found in expenses")
                return False
    return True

def get_user_categories(user_id: ObjectId) -> Dict[ObjectId, str]:
    """Fetch all categories for a user"""
    categories = categories_collection.find({"user": user_id})
    return {cat["_id"]: cat["name"] for cat in categories}

def get_monthly_expenses(user_id: ObjectId) -> Tuple[List[Dict], List[str]]:
    """Fetch and process monthly expenses"""
    category_map = get_user_categories(user_id)
    if not category_map:
        logger.warning(f"No categories found for user {user_id}")
        return [], []
    
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
    
    # Process and validate data
    all_months = set()
    category_activity = {name: 0 for name in category_map.values()}
    
    for record in results:
        year_month = (record["_id"]["year"], record["_id"]["month"])
        all_months.add(year_month)
        category_name = category_map[record["_id"]["category"]]
        category_activity[category_name] += 1
    
    min_occurrences = len(all_months) * 0.5
    active_categories = sorted([
        name for name, count in category_activity.items() 
        if count >= min_occurrences
    ])
    
    if not active_categories:
        logger.warning(f"No active categories for {user_id}")
        return [], []
    
    monthly_data = {}
    for record in results:
        year_month = (record["_id"]["year"], record["_id"]["month"])
        category_name = category_map[record["_id"]["category"]]
        
        if category_name not in active_categories:
            continue
            
        if year_month not in monthly_data:
            monthly_data[year_month] = {name: MIN_EXPENSE_VALUE for name in active_categories}
        
        amount = max(float(record["total"]), MIN_EXPENSE_VALUE)
        monthly_data[year_month][category_name] = amount
    
    sorted_months = sorted(monthly_data.keys())
    monthly_list = [monthly_data[month] for month in sorted_months]
    
    if not validate_expense_data(monthly_list):
        logger.error(f"Invalid data detected for user {user_id}")
        return [], []
    
    return monthly_list, active_categories

def prepare_training_data(monthly_expenses: List[Dict], active_categories: List[str]) -> np.ndarray:
    """Convert to numpy array with consistent category order"""
    return np.array([
        [month.get(category, MIN_EXPENSE_VALUE) for category in active_categories]
        for month in monthly_expenses
    ], dtype='float32')

def save_model_config(user_id: ObjectId, active_categories: List[str]):
    """Save model configuration"""
    config = {
        "user_id": str(user_id),
        "categories": active_categories,
        "updated_at": datetime.datetime.now().isoformat(),
        "min_expense_value": MIN_EXPENSE_VALUE,
        "window_size": WINDOW_SIZE
    }
    with open(f"{CONFIG_DIR}/config_{user_id}.json", 'w') as f:
        json.dump(config, f, indent=2)

def train_model_for_user(user_id: ObjectId) -> bool:
    """Train model for a single user"""
    try:
        logger.info(f"Starting training for user {user_id}")
        
        monthly_expenses, active_categories = get_monthly_expenses(user_id)
        if len(monthly_expenses) < MIN_TRAINING_MONTHS:
            logger.warning(f"Insufficient data for {user_id}")
            return False
            
        training_data = prepare_training_data(monthly_expenses, active_categories)
        
        # Use MinMaxScaler with constrained range
        scaler = MinMaxScaler(feature_range=(1, 2))
        scaled_data = scaler.fit_transform(training_data)
        
        X, y = [], []
        for i in range(len(scaled_data) - WINDOW_SIZE):
            X.append(scaled_data[i:i+WINDOW_SIZE])
            y.append(scaled_data[i+WINDOW_SIZE])
        X, y = np.array(X), np.array(y)
        
        # Build model with ReLU final activation
        model = Sequential([
            LSTM(128, return_sequences=True,
                 input_shape=(WINDOW_SIZE, len(active_categories))),
            LSTM(64),
            Dense(32, activation='relu'),
            Dense(len(active_categories), activation='relu')  # Critical for non-negative outputs
        ])
        
        model.compile(optimizer=Adam(learning_rate=0.001), loss='mse', metrics=['mse'])
        
        # Create training logger
        training_logger = TrainingLogger(user_id)
        
        history = model.fit(
            X, y,
            epochs=200,
            batch_size=16,
            callbacks=[EarlyStopping(monitor='loss', patience=15), training_logger],
            verbose=1
        )
        
        # Save artifacts
        model.save(f"{MODELS_DIR}/model_{user_id}.h5")
        joblib.dump(scaler, f"{MODELS_DIR}/scaler_{user_id}.pkl")
        save_model_config(user_id, active_categories)
        
        logger.info(f"Successfully trained model for {user_id}")
        return True
        
    except Exception as e:
        logger.error(f"Training failed for {user_id}: {str(e)}", exc_info=True)
        return False

def train_models():
    """Train models for all eligible users"""
    user_ids = expenses_collection.distinct("user")
    logger.info(f"Found {len(user_ids)} users")
    
    success_count = 0
    for user_id in user_ids:
        if train_model_for_user(user_id):
            success_count += 1
    
    logger.info(f"Training complete. Successfully trained {success_count}/{len(user_ids)} users")

if __name__ == "__main__":
    train_models()