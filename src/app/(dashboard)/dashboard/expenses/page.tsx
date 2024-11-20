"use client";
import AddExpense from "@/components/expenses/add-expense";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useGetExpenses } from "@/services/api/expenseApi";
import { format } from "date-fns";

export default function ExpenseTable() {
  const { data: expenses } = useGetExpenses();

  const total = expenses?.reduce(
    (sum, expense) => sum + parseInt(expense.amount),
    0
  );

  return (
    <div className="container max-w-6xl mx-auto py-10 px-4">
      <div className="flex w-full justify-between">
        {" "}
        <h2 className="text-2xl font-bold mb-4">Expense Report</h2>
        <AddExpense />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableCaption>A list of your recent expenses.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses?.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {format(expense.date, "MMMM do, yyyy")}
                </TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {typeof expense.category === "object" &&
                    expense.category.name}
                </TableCell>
                <TableCell className="text-right">
                  ${parseInt(expense.amount).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="text-right font-bold">
                ${total?.toFixed(2) || 0.0}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
