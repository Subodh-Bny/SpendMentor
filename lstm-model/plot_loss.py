import os
import glob
import pandas as pd
import matplotlib.pyplot as plt

LOGS_DIR = "./training_logs"
OUTPUT_DIR = "./metrics"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Find the latest training log CSV
csv_files = glob.glob(f"{LOGS_DIR}/training_*.csv")
if not csv_files:
    print("No training log CSV found in ./training_logs")
    exit(1)

log_file = csv_files[0]  # or specify the exact user CSV
print(f"Reading training log from: {log_file}")

df = pd.read_csv(log_file)

# If there were multiple training runs in the same CSV, take the last 200 epochs
if len(df) > 200:
    df = df.iloc[-200:].reset_index(drop=True)
    df['epoch'] = range(1, len(df) + 1)

epochs = df['epoch']
loss = df['loss']

# --- 1. Terminal / Console Print ---
print("\n" + "="*45)
print(f"{'Epoch':<10} | {'Loss (MSE)':<15} | {'Trend'}")
print("="*45)
for i in range(0, len(df), 10):  # Print every 10th epoch
    print(f"Epoch {epochs.iloc[i]:<4} | {loss.iloc[i]:<15.6f} | {'↓' if i > 0 and loss.iloc[i] < loss.iloc[i-10] else '-'}")
print(f"Epoch {epochs.iloc[-1]:<4} | {loss.iloc[-1]:<15.6f} | (Final Epoch)")
print("="*45)

# --- 2. High-Resolution B&W Plot for Academic Report ---
plt.figure(figsize=(8, 5), dpi=300)
plt.plot(epochs, loss, color='black', linewidth=1.8, label='Training Loss (MSE)')

plt.title('LSTM Model Training Loss across Epochs', fontsize=14, fontname='Times New Roman', fontweight='bold')
plt.xlabel('Epochs', fontsize=12, fontname='Times New Roman')
plt.ylabel('Mean Squared Error (MSE)', fontsize=12, fontname='Times New Roman')
plt.xlim(1, max(200, len(epochs)))
plt.grid(True, linestyle='--', alpha=0.6, color='gray')
plt.legend(frameon=True, edgecolor='black')

# Save to figures / metrics folder
plot_path = f"{OUTPUT_DIR}/training_loss_curve.png"
plt.savefig(plot_path, bbox_inches='tight')
plt.close()

print(f"\nSaved loss curve plot to: {plot_path}")
