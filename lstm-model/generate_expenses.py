import random
import json
from datetime import datetime, timedelta

# Constants
category_ids = [
    "681c04bbe4ad329ef53317b1",
    "681c04b1e4ad329ef53317ab",
    "681c04b6e4ad329ef53317ae"
]
user_id = "67867f157c59d7db75ad63af"
start_date = datetime(2024, 8, 1)
end_date = datetime(2025, 1, 1)
descriptions = ["Groceries", "Fruits", "Vegetables", "Snacks", "Juice", "Milk", "Bread", "Rice", "Eggs"]

expenses = []
current_date = start_date

# Generate expenses
while current_date <= end_date:
    for _ in range(random.randint(2, 3)):  # 2–3 expenses per day
        expense = {
            "date": {"$date": current_date.strftime("%Y-%m-%dT00:00:00Z")},
            "amount": str(random.randint(300, 3000)),
            "description": random.choice(descriptions),
            "category": {"$oid": random.choice(category_ids)},
            "user": {"$oid": user_id},
            "createdAt": {"$date": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")},
            "updatedAt": {"$date": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")}
        }
        expenses.append(expense)
    current_date += timedelta(days=1)

# Save to a JSON file
file_path = "more_expenses_jan_to_apr_2025.json"
with open(file_path, "w") as f:
    json.dump(expenses, f, indent=2)

print(f"Data saved to {file_path}")
