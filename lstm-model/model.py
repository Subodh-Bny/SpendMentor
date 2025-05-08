import numpy as np
from pymongo import MongoClient
from sklearn.preprocessing import MinMaxScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from typing import List
# MongoDB connection
client = MongoClient("mongodb+srv://subodh_brushstroke:65nQOXyGwE5BNq1B@cluster0.dpqxvte.mongodb.net/SpendWise?retryWrites=true&w=majority&appName=Cluster0")
db = client["SpendWise"]

# Fetch user-specific expense data
def fetch_expenses(user_id: str):
    expenses_collection = db["expenses"]
    expenses = List(expenses_collection.find({"user": user_id}))
    
    # Process and map expenses to the respective categories
    expenses_dict = {}
    categories = db["categories"].find({"user": user_id})
    category_names = {category["_id"]: category["name"] for category in categories}
    
    # Initialize expenses list for each category
    for category_id in category_names:
        expenses_dict[category_names[category_id]] = []

    for expense in expenses:
        category_name = category_names.get(expense["category"])
        if category_name:
            expenses_dict[category_name].append(expense["amount"])

    # Ensure data is complete (fill any missing months with 0s)
    full_expenses = []
    max_length = max(len(expenses_dict[cat]) for cat in expenses_dict)
    for i in range(max_length):
        month_data = [expenses_dict[cat][i] if i < len(expenses_dict[cat]) else 0 for cat in expenses_dict]
        full_expenses.append(month_data)
    return np.array(full_expenses)

# Create sequences for training
def create_dataset(data, window_size=6):
    X, y = [], []
    for i in range(len(data) - window_size):
        X.append(data[i:i+window_size])
        y.append(data[i+window_size])
    return np.array(X), np.array(y)

# Train and predict function
def train_and_predict(user_id: str, past_expenses):
    # Fetch and process data from MongoDB for the given user
    full_expenses = fetch_expenses(user_id)
    
    # Scale the data
    scaler = MinMaxScaler()
    scaled_data = scaler.fit_transform(full_expenses)

    # Prepare the data for LSTM input
    window_size = 6
    X, y = create_dataset(scaled_data, window_size)

    # Define the LSTM model
    model = Sequential([
        LSTM(64, input_shape=(window_size, len(full_expenses[0]))),
        Dense(len(full_expenses[0]))  # One output per category
    ])
    model.compile(optimizer="adam", loss="mse")

    # Train the model
    model.fit(X, y, epochs=100, verbose=1)

    # Save the model and scaler for future use
    model.save(f"{user_id}_model_weights.h5")
    np.save(f"{user_id}_scaler_min.npy", scaler.data_min_)
    np.save(f"{user_id}_scaler_max.npy", scaler.data_max_)

    # Predict the next month's expenses using the provided past expenses
    input_data = np.array(past_expenses, dtype='float32')
    scaled_input = scaler.transform(input_data)
    input_seq = scaled_input.reshape((1, 6, scaled_input.shape[1]))
    
    prediction_scaled = model.predict(input_seq, verbose=0)[0]
    prediction = scaler.inverse_transform([prediction_scaled])[0]

    return prediction.tolist()
