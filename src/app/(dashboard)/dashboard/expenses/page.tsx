"use client";

import AddExpense from "@/app/(dashboard)/dashboard/expenses/add-expense";
import { Button } from "@/components/ui/button";
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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDeleteExpense, useGetExpenses } from "@/services/api/expenseApi";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { ClipLoader } from "react-spinners";

export default function ExpenseTable() {
  const { data: expenses } = useGetExpenses();
  const [addUpdateDialogOpen, setAddUpdateDialogOpen] =
    useState<boolean>(false);
  const [updateExpense, setUpdateExpense] = useState<IExpense | undefined>(
    undefined
  );

  const total = expenses?.reduce(
    (sum, expense) => sum + parseInt(expense.amount),
    0
  );

  const { mutate: deleteExpense, isPending: deletePending } =
    useDeleteExpense();

  const handleDialog = (expense?: IExpense) => {
    setAddUpdateDialogOpen(true);
    setUpdateExpense(expense || undefined);
  };

  return (
    <div>
      <div className="flex w-full justify-between">
        <h2 className="text-2xl font-bold mb-4">Expense Report</h2>
        <Button onClick={() => handleDialog()}>Add expense</Button>
        <AddExpense
          open={addUpdateDialogOpen}
          setOpen={setAddUpdateDialogOpen}
          expense={updateExpense}
          setExpense={setUpdateExpense}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableCaption>A list of your recent expenses.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="table-cell">Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses?.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">
                  {format(new Date(expense.date), "MMMM do, yyyy")}
                </TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell className="table-cell">
                  {typeof expense.category === "object" &&
                    expense.category.name}
                </TableCell>
                <TableCell>${parseInt(expense.amount).toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-2 justify-end">
                    <Button size="icon" onClick={() => handleDialog(expense)}>
                      <Pencil className="h-4 w-4" />
                      <span className="sr-only">Edit expense</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete expense</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Are you absolutely sure?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the expense data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <Button
                            variant="destructive"
                            disabled={deletePending}
                            onClick={() => deleteExpense(expense.id || "")}
                          >
                            {deletePending ? (
                              <ClipLoader size={15} />
                            ) : (
                              "Delete"
                            )}
                          </Button>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4}>Total</TableCell>
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
