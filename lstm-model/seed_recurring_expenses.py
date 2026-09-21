"""
Seed script: inserts realistic recurring/subscription expenses
for user 67867f157c59d7db75ad63af into the RecurringExpense collection.

Run:  ./venv/bin/python seed_recurring_expenses.py
"""

from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime

MONGO_URI = (
    "mongodb://subodh_brushstroke:65nQOXyGwE5BNq1B@"
    "ac-7ajjmln-shard-00-00.dpqxvte.mongodb.net:27017,"
    "ac-7ajjmln-shard-00-01.dpqxvte.mongodb.net:27017,"
    "ac-7ajjmln-shard-00-02.dpqxvte.mongodb.net:27017"
    "/SpendWise?ssl=true&authSource=admin"
    "&replicaSet=atlas-thk0nk-shard-0&retryWrites=true&w=majority"
)

client = MongoClient(MONGO_URI)
db = client["SpendWise"]
collection = db["recurringexpenses"]

USER_ID = ObjectId("67867f157c59d7db75ad63af")

recurring = [
    # Subscriptions (high amount, low-medium priority → good cut candidates)
    {"name": "Netflix",          "amount": 1300,  "priority_score": 35, "category": "Subscription"},
    {"name": "Spotify Premium",  "amount":  900,  "priority_score": 40, "category": "Subscription"},
    {"name": "Amazon Prime",     "amount": 1200,  "priority_score": 30, "category": "Subscription"},
    {"name": "YouTube Premium",  "amount":  600,  "priority_score": 25, "category": "Subscription"},

    # Food & Lifestyle (recurring, variable priority)
    {"name": "Daily Coffee",     "amount": 9000,  "priority_score": 20, "category": "Food & Drink"},
    {"name": "Dining Out",       "amount": 15000, "priority_score": 15, "category": "Food & Drink"},
    {"name": "Snacks & Sweets",  "amount": 3000,  "priority_score": 22, "category": "Food & Drink"},

    # Health & Fitness
    {"name": "Gym Membership",   "amount": 3500,  "priority_score": 60, "category": "Health"},
    {"name": "Yoga Classes",     "amount": 2500,  "priority_score": 55, "category": "Health"},

    # Utilities / Essentials (high priority → should not be cut)
    {"name": "Mobile Data Plan", "amount": 1500,  "priority_score": 90, "category": "Utilities"},
    {"name": "Internet Bill",    "amount": 2000,  "priority_score": 88, "category": "Utilities"},
    {"name": "Electricity Bill", "amount": 3000,  "priority_score": 95, "category": "Utilities"},

    # Transport
    {"name": "Ride Sharing",     "amount": 5000,  "priority_score": 45, "category": "Transport"},
    {"name": "Fuel",             "amount": 6000,  "priority_score": 70, "category": "Transport"},
]

now = datetime.utcnow()
docs = [
    {
        **item,
        "user": USER_ID,
        "is_active": True,
        "createdAt": now,
        "updatedAt": now,
    }
    for item in recurring
]

# Clear existing for this user before re-seeding
collection.delete_many({"user": USER_ID})
result = collection.insert_many(docs)
print(f"✅  Inserted {len(result.inserted_ids)} recurring expenses for user {USER_ID}")
client.close()
