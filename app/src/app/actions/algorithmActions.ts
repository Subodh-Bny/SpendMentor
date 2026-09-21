'use server'

import dbConnect from '@/lib/dbConnect';
import Expense from '@/models/expenses.model';
import RecurringExpense from '@/models/recurring-expense.model';
import { algorithmClient, ExpenseItem } from '@/lib/api/algorithmClient';
import { revalidatePath } from 'next/cache';

export async function checkAndStoreAnomalies(userId: string) {
  try {
    await dbConnect();
    
    // 1. Fetch historical transactions for the user
    const userExpenses = await Expense.find({ user: userId })
      .populate('category', 'name')
      .lean();
    if (userExpenses.length < 3) return { success: false, message: 'Not enough data' };

    // Format for FastAPI — include description for display
    const transactions = userExpenses.map((exp: any) => ({
      id: exp._id.toString(),
      amount: Number(exp.amount),
      description: (exp.category as any)?.name || exp.description || 'Expense'
    }));

    // 2. Pass to FastAPI
    const anomalyResult = await algorithmClient.detectAnomalies(transactions, 2.5);

    // 3. Update MongoDB for flagged anomalies
    const flaggedIds = anomalyResult.flagged_transactions.map((t: any) => t.id);
    
    if (flaggedIds.length > 0) {
      await Expense.updateMany(
        { _id: { $in: flaggedIds } },
        { $set: { isAnomaly: true, flaggedDate: new Date() } }
      );
    }

    // Build detailed flagged list for UI display
    const expenseById = Object.fromEntries(
      userExpenses.map((e: any) => [e._id.toString(), e])
    );
    const flaggedDetails = anomalyResult.flagged_transactions.map((t: any) => {
      const exp = expenseById[t.id];
      return {
        id: t.id,
        description: (exp?.category as any)?.name || exp?.description || 'Expense',
        amount: Number(exp?.amount ?? t.amount),
        date: exp?.date ? new Date(exp.date).toLocaleDateString() : null,
        z_score: t.anomaly_score ?? t.z_score ?? null,
      };
    });

    revalidatePath('/dashboard');
    return {
      success: true,
      anomaliesDetected: flaggedIds.length,
      flaggedDetails,
      data: anomalyResult,
    };
  } catch (error) {
    console.error("Anomaly Check Error:", error);
    return { success: false, message: 'Failed to process anomalies' };
  }
}

/** Fetch all active recurring expenses for a user and shape them for the budget optimizer */
export async function getRecurringExpenses(userId: string): Promise<ExpenseItem[]> {
  try {
    await dbConnect();
    const items = await RecurringExpense.find({ user: userId, is_active: true })
      .sort({ priority_score: 1 })   // lowest priority first (best cut candidates at top)
      .lean();

    return items.map((item: any) => ({
      id:             item._id.toString(),
      name:           item.name,
      amount:         item.amount,
      priority_score: item.priority_score,
    }));
  } catch (error) {
    console.error("getRecurringExpenses error:", error);
    return [];
  }
}
