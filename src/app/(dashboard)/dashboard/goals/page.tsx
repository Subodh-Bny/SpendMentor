"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  useGetSavingsGoal,
  useCreateSavingsGoal,
  useUpdateSavingsGoal,
  useDeleteSavingsGoal,
} from "@/services/api/savingsGoalApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MonthYearPicker } from "@/components/month-year-picker";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import toast from "react-hot-toast";
import { savingsGoalSchema } from "@/lib/validations/savingGoals";

function SavingsGoal() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingGoal, setEditingGoal] = useState<ISavingsGoal | null>(null);

  const { data: savingsGoals, refetch } = useGetSavingsGoal();
  const { mutate: createSavingsGoal } = useCreateSavingsGoal();
  const { mutate: updateSavingsGoal } = useUpdateSavingsGoal();
  const { mutate: deleteSavingsGoal } = useDeleteSavingsGoal();

  const form = useForm<z.infer<typeof savingsGoalSchema>>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: {
      targetAmount: "",
      currentAmount: "",
    },
  });

  useEffect(() => {
    if (editingGoal) {
      form.reset({
        targetAmount: editingGoal.targetAmount,
        currentAmount: editingGoal.currentAmount,
      });
      setSelectedDate(new Date(editingGoal.targetDate));
    } else {
      form.reset({
        targetAmount: "",
        currentAmount: "",
      });
      setSelectedDate(null);
    }
  }, [editingGoal, form]);

  const onSubmit = (values: z.infer<typeof savingsGoalSchema>) => {
    if (!selectedDate) {
      toast.error("Please select a target date");
      return;
    }

    if (editingGoal) {
      updateSavingsGoal(
        { ...editingGoal, ...values, targetDate: selectedDate },
        {
          onSuccess: () => {
            setEditingGoal(null);
            refetch();
          },
        }
      );
    } else {
      createSavingsGoal(
        { ...values, targetDate: selectedDate },
        {
          onSuccess: () => {
            refetch();
          },
        }
      );
    }
    form.reset();
    setSelectedDate(null);
  };

  const handleDelete = (goal: ISavingsGoal) => {
    deleteSavingsGoal(goal.id || "", {
      onSuccess: () => {
        refetch();
      },
    });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingGoal ? "Edit Savings Goal" : "Create Savings Goal"}
          </CardTitle>
          <CardDescription>
            Set or update your savings goal for a specific month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Amount</FormLabel>
                    <FormControl>
                      <Input placeholder="5000" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter your target savings amount
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Amount</FormLabel>
                    <FormControl>
                      <Input placeholder="1000" {...field} />
                    </FormControl>
                    <FormDescription>
                      Enter your current savings amount
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel>Target Date</FormLabel>
                <MonthYearPicker
                  value={selectedDate || undefined}
                  onChange={(date) => setSelectedDate(date)}
                  isDateDisabled={(date) =>
                    savingsGoals?.some(
                      (goal) =>
                        new Date(goal.targetDate).getMonth() ===
                          date.getMonth() &&
                        new Date(goal.targetDate).getFullYear() ===
                          date.getFullYear() &&
                        goal.id !== editingGoal?.id
                    ) || false
                  }
                />
              </FormItem>
              <Button type="submit">
                {editingGoal ? "Update Goal" : "Create Goal"}
              </Button>
              {editingGoal && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingGoal(null)}
                  className="ml-2"
                >
                  Cancel Edit
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Savings Goals</CardTitle>
          <CardDescription>View and manage your savings goals</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target Date</TableHead>
                <TableHead>Target Amount</TableHead>
                <TableHead>Current Amount</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savingsGoals?.map((goal) => (
                <TableRow key={goal.id}>
                  <TableCell>
                    {format(new Date(goal.targetDate), "MMMM yyyy")}
                  </TableCell>
                  <TableCell>{goal.targetAmount}</TableCell>
                  <TableCell>{goal.currentAmount}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingGoal(goal)}
                      className="mr-2"
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(goal)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default SavingsGoal;
