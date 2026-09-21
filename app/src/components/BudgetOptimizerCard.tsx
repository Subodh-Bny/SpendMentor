'use client';

import React, { useState } from 'react';
import { algorithmClient, ExpenseItem } from '@/lib/api/algorithmClient';

export default function BudgetOptimizerCard({ initialExpenses }: { initialExpenses?: ExpenseItem[] }) {
  const [target, setTarget] = useState<number>(0);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const activeExpenses = initialExpenses ?? [];

  // Same color map as RecurringExpensesTable for consistency
  const CATEGORY_COLORS: Record<string, string> = {
    Subscription:  'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    'Food & Drink': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    Health:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    Utilities:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    Transport:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    Other:         'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  };

  // Build id → category lookup from the DB items passed in
  const categoryById = Object.fromEntries(
    activeExpenses.map((e: any) => [e.id, e.category ?? 'Other'])
  );

  const handleOptimize = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await algorithmClient.optimizeBudget(target, activeExpenses);
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm h-full">
      <h2 className="text-xl font-bold mb-2">Budget Optimizer (0/1 Knapsack)</h2>
      <p className="text-sm text-slate-500 mb-6">Enter your monthly savings target to find the optimal expenses to cut.</p>
      
      <form onSubmit={handleOptimize} className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rs.</span>
            <input
              type="number"
              value={target || ''}
              onChange={(e) => setTarget(Number(e.target.value))}
              placeholder="Target Monthly Savings"
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent text-slate-900 dark:text-slate-100"
              required
              min="1"
            />
          </div>
        </div>
        <button 
          type="submit" 
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium whitespace-nowrap"
        >
          {loading ? 'Calculating...' : 'Calculate Cuts'}
        </button>
      </form>

      {activeExpenses.length === 0 && (
        <p className="text-sm text-slate-400 italic mb-4">No recurring expenses found. Add some from the table on the left.</p>
      )}

      {results && (
        <div className="mt-6 border-t border-slate-200 dark:border-slate-800 pt-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="font-semibold text-lg text-emerald-600 dark:text-emerald-500">Recommended Cuts</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Total Saved: <span className="font-bold">Rs. {results.total_saved_amount.toLocaleString()}</span>
                <span className="ml-1 text-slate-400">(Target: Rs. {results.target_savings.toLocaleString()})</span>
              </p>
            </div>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          <ul className="space-y-2 mb-4 max-h-[300px] overflow-y-auto pr-1">
            {results.recommended_cuts.map((cut: any) => {
              const priorityLabel = cut.priority_score <= 30 ? '🔴 Low' : cut.priority_score <= 60 ? '🟡 Medium' : '🟢 High';
              const cat = categoryById[cut.id] ?? 'Other';
              const colorClass = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['Other'];
              return (
                <li key={cut.id} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${colorClass}`}>{cat}</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{cut.name}</span>
                    <span className="text-xs shrink-0 text-slate-500">{priorityLabel}</span>
                  </div>
                  <span className="font-semibold text-red-500 shrink-0 ml-2">Rs. {cut.amount.toLocaleString()}</span>
                </li>
              );
            })}
          </ul>

          {showDetails && (
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-mono text-slate-700 dark:text-slate-300 overflow-x-auto">
              <p className="mb-2 font-semibold">⚡ Execution Details</p>
              <ul className="space-y-1 text-xs">
                <li><span className="text-slate-500">Time Complexity:</span> {results.execution_details.time_complexity}</li>
                <li><span className="text-slate-500">Space Complexity:</span> {results.execution_details.space_complexity}</li>
                <li><span className="text-slate-500">Matrix Shape:</span> {results.execution_details.dp_matrix_shape}</li>
                <li><span className="text-slate-500">Execution Time:</span> {results.execution_details.execution_time_ms} ms</li>
                <li><span className="text-slate-500">Recurrence:</span> <span className="text-blue-600 dark:text-blue-400">{results.execution_details.mathematical_recurrence}</span></li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
