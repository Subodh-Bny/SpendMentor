'use client';

import { useState } from 'react';
import { algorithmClient, ExpenseItem } from '@/lib/api/algorithmClient';

export default function BudgetOptimizer({ initialExpenses }: { initialExpenses: ExpenseItem[] }) {
  const [target, setTarget] = useState<number>(0);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await algorithmClient.optimizeBudget(target, initialExpenses);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-800">0/1 Knapsack Budget Optimizer</h2>
      
      <form onSubmit={handleOptimize} className="flex gap-4 mb-6">
        <input
          type="number"
          value={target || ''}
          onChange={(e) => setTarget(Number(e.target.value))}
          placeholder="Target Savings Goal ($)"
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
          required
          min="1"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Calculating...' : 'Optimize Cuts'}
        </button>
      </form>

      {results && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-black">
          <h3 className="font-semibold text-green-800 mb-2">Recommended Cuts</h3>
          <p className="text-sm text-green-700 mb-4">
            Total Saved: <strong>${results.total_saved_amount}</strong> (Target: ${results.target_savings})
          </p>
          <ul className="divide-y divide-green-200">
            {results.recommended_cuts.map((cut: any) => (
              <li key={cut.id} className="py-2 flex justify-between">
                <span>{cut.name}</span>
                <span className="font-medium text-red-600">${cut.amount}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
