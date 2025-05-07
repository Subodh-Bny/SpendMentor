# train.py

import numpy as np
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense
from sklearn.preprocessing import MinMaxScaler
import os

# 1. Simulated monthly total expenses (you'll replace with real data later)
monthly_expenses = np.array([
    1000, 1050, 1100, 980, 1200, 1250,
    1300, 1400, 1350, 1280, 1380, 1450,
    1500, 1520, 1550, 1580, 1600, 1620,
    1650, 1700, 1720, 1750, 1780, 1800
], dtype='float32')  # 24 months of data

# 2. Normalize the data
scaler = MinMaxScaler()
scaled = scaler.fit_transform(monthly_expenses.reshape(-1, 1)).flatten()

# 3. Create sequences of [past 6 months] => [next month]
def create_dataset(data, window_size=6):
    X, y = [], []
    for i in range(len(data) - window_size):
        X.append(data[i:i+window_size])
        y.append(data[i+window_size])
    return np.array(X), np.array(y)

window_size = 6
X, y = create_dataset(scaled, window_size)
X = X.reshape((X.shape[0], X.shape[1], 1))  # [samples, timesteps, features]

# 4. Build and train the LSTM model
model = Sequential([
    LSTM(64, input_shape=(window_size, 1)),
    Dense(1)
])
model.compile(optimizer='adam', loss='mse')
model.fit(X, y, epochs=100, verbose=1)

# 5. Save model and scaler info
model.save("model_weights.h5")
np.save("scaler_min.npy", scaler.data_min_)
np.save("scaler_max.npy", scaler.data_max_)

print("✅ Model trained and saved.")
