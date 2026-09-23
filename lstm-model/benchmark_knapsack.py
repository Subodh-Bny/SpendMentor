import time
import random
import os
import matplotlib.pyplot as plt
from typing import List, Tuple
from pydantic import BaseModel

OUTPUT_DIR = "./metrics"
os.makedirs(OUTPUT_DIR, exist_ok=True)

class ExpenseItem(BaseModel):
    id: str
    name: str
    amount: float
    priority_score: int

def solve_01_knapsack(
    items: List[ExpenseItem],
    capacity: float,
    scale_factor: int = 1,
) -> Tuple[List[ExpenseItem], int, float, dict]:
    start_time = time.perf_counter()
    scaled_capacity = int(round(capacity * scale_factor))
    n = len(items)

    weights = [int(round(item.amount * scale_factor)) for item in items]
    values = [item.priority_score for item in items]

    dp = [[0] * (scaled_capacity + 1) for _ in range(n + 1)]

    for i in range(1, n + 1):
        item_weight = weights[i - 1]
        item_val = values[i - 1]
        for w in range(scaled_capacity + 1):
            if item_weight <= w:
                dp[i][w] = max(dp[i - 1][w], dp[i - 1][w - item_weight] + item_val)
            else:
                dp[i][w] = dp[i - 1][w]

    selected_items: List[ExpenseItem] = []
    w = scaled_capacity
    for i in range(n, 0, -1):
        if dp[i][w] != dp[i - 1][w]:
            selected_items.append(items[i - 1])
            w -= weights[i - 1]

    selected_items.reverse()
    total_saved = sum(item.amount for item in selected_items)
    max_priority = dp[n][scaled_capacity]
    execution_time_ms = (time.perf_counter() - start_time) * 1000

    metadata = {
        "capacity_w": scaled_capacity,
        "num_items": n,
        "dp_matrix_shape": f"{n + 1} x {scaled_capacity + 1}",
        "time_complexity": "O(n * W)",
        "space_complexity": "O(n * W)",
        "execution_time_ms": round(execution_time_ms, 4),
        "mathematical_recurrence": "DP[i][w] = max(DP[i-1][w], DP[i-1][w - w[i]] + v[i])",
    }

    return selected_items, max_priority, total_saved, metadata

def generate_mock_expenses(count: int) -> List[ExpenseItem]:
    names = ["Gym", "Netflix", "Spotify", "Internet", "Dining Out", "Coffee", "Gaming", "Cloud Storage", "Magazine", "Course Subscription"]
    items = []
    random.seed(42)
    for i in range(count):
        items.append(
            ExpenseItem(
                id=f"exp_{i+1}",
                name=f"{names[i % len(names)]} #{i+1}",
                amount=float(random.randint(100, 3000)),
                priority_score=random.randint(10, 95)
            )
        )
    return items

def run_benchmarks():
    print("\n" + "="*70)
    print("      SPENDMENTOR 0/1 KNAPSACK OPTIMIZER EMPIRICAL BENCHMARK")
    print("="*70)

    # 1. Realistic Workloads (SpendMentor typical user recurring expenses)
    realistic_scenarios = [
        (5, 2000),
        (10, 5000),
        (15, 8000),
        (20, 10000),
        (30, 15000),
    ]

    print("\n[Scenario 1: Realistic SpendMentor User Workloads]")
    print(f"{'Items (n)':<12} | {'Target W (NPR)':<16} | {'DP Grid Entries':<18} | {'Exec Time (ms)':<15}")
    print("-" * 70)
    for n_items, cap in realistic_scenarios:
        items = generate_mock_expenses(n_items)
        times = []
        for _ in range(5):
            _, _, _, meta = solve_01_knapsack(items, cap)
            times.append(meta["execution_time_ms"])
        avg_time = sum(times) / len(times)
        entries = (n_items + 1) * (cap + 1)
        print(f"{n_items:<12} | {cap:<16} | {entries:<18,d} | {avg_time:<15.4f}")

    # 2. Scalability across items n (Fixed W = 5,000)
    item_counts = [5, 10, 25, 50, 100, 150, 200]
    fixed_w = 5000
    times_vs_n = []

    print("\n[Scenario 2: Scalability vs Number of Items (n) with Capacity W = 5,000]")
    print(f"{'Items (n)':<12} | {'Capacity (W)':<14} | {'Exec Time (ms)':<15} | {'Complexity O(n·W)'}")
    print("-" * 70)
    for n in item_counts:
        items = generate_mock_expenses(n)
        times = []
        for _ in range(3):
            _, _, _, meta = solve_01_knapsack(items, fixed_w)
            times.append(meta["execution_time_ms"])
        avg_time = sum(times) / len(times)
        times_vs_n.append(avg_time)
        print(f"{n:<12} | {fixed_w:<14} | {avg_time:<15.4f} | {n * fixed_w:,d} ops")

    # 3. Scalability across capacity W (Fixed n = 25 items)
    capacities = [1000, 2500, 5000, 7500, 10000, 15000, 20000]
    fixed_n = 25
    times_vs_w = []
    items_fixed = generate_mock_expenses(fixed_n)

    print("\n[Scenario 3: Scalability vs Capacity (W) with Fixed Items n = 25]")
    print(f"{'Items (n)':<12} | {'Capacity (W)':<14} | {'Exec Time (ms)':<15} | {'Complexity O(n·W)'}")
    print("-" * 70)
    for cap in capacities:
        times = []
        for _ in range(3):
            _, _, _, meta = solve_01_knapsack(items_fixed, cap)
            times.append(meta["execution_time_ms"])
        avg_time = sum(times) / len(times)
        times_vs_w.append(avg_time)
        print(f"{fixed_n:<12} | {cap:<14} | {avg_time:<15.4f} | {fixed_n * cap:,d} ops")

    # --- 4. Generate Publication-Quality Black & White Plots for Report ---
    plt.figure(figsize=(10, 4.5), dpi=300)

    # Subplot 1: Time vs Number of Items n
    plt.subplot(1, 2, 1)
    plt.plot(item_counts, times_vs_n, 'ko-', linewidth=1.5, markersize=5, label='Measured Runtime')
    plt.title('(a) Runtime vs Number of Candidate Items ($n$)\n[Fixed Capacity $W$ = 5,000]', fontsize=11, fontname='Times New Roman')
    plt.xlabel('Number of Items ($n$)', fontsize=10, fontname='Times New Roman')
    plt.ylabel('Execution Time (ms)', fontsize=10, fontname='Times New Roman')
    plt.grid(True, linestyle='--', alpha=0.6, color='gray')
    plt.legend(frameon=True, edgecolor='black')

    # Subplot 2: Time vs Capacity W
    plt.subplot(1, 2, 2)
    plt.plot(capacities, times_vs_w, 'ks-', linewidth=1.5, markersize=5, label='Measured Runtime')
    plt.title('(b) Runtime vs Target Savings Capacity ($W$)\n[Fixed Candidate Items $n$ = 25]', fontsize=11, fontname='Times New Roman')
    plt.xlabel('Savings Capacity $W$ (NPR)', fontsize=10, fontname='Times New Roman')
    plt.ylabel('Execution Time (ms)', fontsize=10, fontname='Times New Roman')
    plt.grid(True, linestyle='--', alpha=0.6, color='gray')
    plt.legend(frameon=True, edgecolor='black')

    plt.tight_layout()
    chart_path = f"{OUTPUT_DIR}/knapsack_benchmark.png"
    plt.savefig(chart_path, bbox_inches='tight')
    plt.close()

    print("\n" + "="*70)
    print(f"Benchmark plot successfully saved to: {chart_path}")
    print("="*70 + "\n")

if __name__ == "__main__":
    run_benchmarks()
