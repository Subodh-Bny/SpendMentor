import React from 'react';
import BudgetOptimizerCard from '@/components/BudgetOptimizerCard';
import AnomalyAlertBanner from '@/components/AnomalyAlertBanner';
import { getRecurringExpenses } from '@/app/actions/algorithmActions';
import RecurringExpensesTable from '@/components/RecurringExpensesTable';

// Hardcoded for now — swap for session user ID once auth is wired
const USER_ID = '67867f157c59d7db75ad63af';

export default async function AlgorithmsPage() {
  const recurringExpenses = await getRecurringExpenses(USER_ID);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold mb-6">Budget Analysis Tools</h1>

      {/* Anomaly alert pulls historical expenses from DB via server action */}
      <AnomalyAlertBanner userId={USER_ID} />

      {/* Two column layout: recurring expenses table + optimizer */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Left: shows all the recurring items stored in DB */}
        <RecurringExpensesTable expenses={recurringExpenses} userId={USER_ID} />

        {/* Right: optimizer uses those real items to calculate cuts */}
        <BudgetOptimizerCard initialExpenses={recurringExpenses} />
      </section>
    </div>
  );
}
