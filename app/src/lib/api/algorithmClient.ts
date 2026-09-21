const FASTAPI_BASE_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  priority_score: number;
}

export interface TransactionItem {
  id: string;
  amount: number;
  description?: string;
}

export const algorithmClient = {
  async optimizeBudget(targetSavings: number, expenses: ExpenseItem[]) {
    const res = await fetch(`${FASTAPI_BASE_URL}/api/v1/optimize-budget`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target_savings: targetSavings, expenses }),
    });
    
    if (!res.ok) throw new Error('Failed to optimize budget');
    return res.json();
  },

  async detectAnomalies(transactions: TransactionItem[], thresholdZ = 2.5) {
    const res = await fetch(`${FASTAPI_BASE_URL}/api/v1/detect-anomalies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions, threshold_z: thresholdZ }),
    });

    if (!res.ok) throw new Error('Failed to detect anomalies');
    return res.json();
  }
};
