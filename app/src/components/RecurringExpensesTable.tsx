'use client';

import React, { useState, useTransition } from 'react';
import { ExpenseItem } from '@/lib/api/algorithmClient';
import { useRouter } from 'next/navigation';

const CATEGORY_COLORS: Record<string, string> = {
  Subscription: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  'Food & Drink': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  Health:        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  Utilities:     'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Transport:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Other:         'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

interface Props {
  expenses: ExpenseItem[];
  userId: string;
}

export default function RecurringExpensesTable({ expenses, userId }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: '', amount: '', priority_score: '50', category: 'Other',
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/recurring-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, userId }),
    });
    setForm({ name: '', amount: '', priority_score: '50', category: 'Other' });
    setShowForm(false);
    startTransition(() => router.refresh());
  };

  const totalMonthly = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Recurring Expenses</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Total / month: <span className="font-semibold text-slate-700 dark:text-slate-300">Rs. {totalMonthly.toLocaleString()}</span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
        >
          {showForm ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <input
            required placeholder="Name (e.g. Netflix)"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="col-span-2 px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">Rs.</span>
            <input
              required type="number" min="1" placeholder="Monthly amount"
              value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="w-full pl-8 pr-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Priority (1 = cut first, 100 = keep)</label>
            <input
              type="range" min="1" max="100" step="1"
              value={form.priority_score} onChange={e => setForm(f => ({ ...f, priority_score: e.target.value }))}
              className="w-full"
            />
            <span className="text-xs text-slate-500 text-right">{form.priority_score}</span>
          </div>
          <select
            value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="col-span-2 px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {['Subscription', 'Food & Drink', 'Health', 'Utilities', 'Transport', 'Other'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="submit" disabled={isPending}
            className="col-span-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
        </form>
      )}

      <ul className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[420px] overflow-y-auto -mx-2">
        {expenses.map(exp => {
          const cat = (exp as any).category ?? 'Other';
          const colorClass = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['Other'];
          const priorityLabel = exp.priority_score <= 30 ? '🔴 Low' : exp.priority_score <= 60 ? '🟡 Medium' : '🟢 High';
          return (
            <li key={exp.id} className="flex items-center justify-between px-2 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-lg">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${colorClass}`}>{cat}</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{exp.name}</span>
              </div>
              <div className="flex items-center gap-3 ml-2 shrink-0">
                <span className="text-xs text-slate-500">{priorityLabel}</span>
                <span className="text-sm font-semibold">Rs. {exp.amount.toLocaleString()}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
