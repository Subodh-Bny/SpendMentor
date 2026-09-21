import random
import json
from datetime import datetime, timedelta
from pymongo import MongoClient
from bson import ObjectId

# Constants
category_ids = [
    ObjectId("681c04bbe4ad329ef53317b1"),
    ObjectId("681c04b1e4ad329ef53317ab"),
    ObjectId("681c04b6e4ad329ef53317ae"),
    ObjectId("681f03490f1a9e2e0f3b6da7")
]
user_id = ObjectId("67867f157c59d7db75ad63af")
start_date = datetime(2025, 3, 30)
end_date = datetime(2026, 9, 20)
descriptions = ["Groceries", "Fruits", "Vegetables", "Snacks", "Juice", "Milk", "Bread", "Rice", "Eggs"]

expenses = []
current_date = start_date

# Generate expenses
while current_date <= end_date:
    for _ in range(random.randint(2, 3)):  # 2–3 expenses per day
        expense = {
            "date": current_date,
            "amount": str(random.randint(300, 3000)),
            "description": random.choice(descriptions),
            "category": random.choice(category_ids),
            "user": user_id,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        expenses.append(expense)
    current_date += timedelta(days=1)

client = MongoClient("mongodb://subodh_brushstroke:65nQOXyGwE5BNq1B@ac-7ajjmln-shard-00-00.dpqxvte.mongodb.net:27017,ac-7ajjmln-shard-00-01.dpqxvte.mongodb.net:27017,ac-7ajjmln-shard-00-02.dpqxvte.mongodb.net:27017/SpendWise?ssl=true&authSource=admin&replicaSet=atlas-thk0nk-shard-0&retryWrites=true&w=majority&appName=Cluster0")
db = client['SpendWise']
expenses_collection = db['expenses']

expenses_collection.insert_many(expenses)
print(f"Data saved to MongoDB: {len(expenses)} records")
