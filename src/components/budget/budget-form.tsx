"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import budgetSchema from "@/lib/validations/budget";
import { useGetCategories } from "@/services/api/categoryApi";
import { useEffect } from "react";

interface BudgetFormProps {
  budget?: IBudget;
  onSubmit: (budget: Omit<IBudget, "id" | "spent">) => void;
  onDelete?: () => void;
}

export function BudgetForm({ budget, onSubmit, onDelete }: BudgetFormProps) {
  const { data: categories } = useGetCategories();

  const form = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
    defaultValues: budget
      ? {
          category:
            typeof budget.category === "object"
              ? budget.category.id
              : budget.category,
          amount: budget.amount,
          month: budget.month,
        }
      : {
          category: categories && categories.length > 0 ? categories[0].id : "",
          amount: 10,
          month: new Date().toISOString().slice(0, 7),
        },
  });

  useEffect(() => {
    if (!budget && categories) {
      form.reset({
        category: categories.length > 0 ? categories[0].id : "",
        amount: 10,
        month: new Date().toISOString().slice(0, 7), // Current month in YYYY-MM format
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budget, categories]);

  function handleSubmit(values: z.infer<typeof budgetSchema>) {
    onSubmit({
      category: values.category,
      amount: values.amount,
      month: values.month,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category?.id || ""}>
                      {category?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Budget Amount</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="month"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Month</FormLabel>
              <FormControl>
                <Input type="month" {...field} />
              </FormControl>
              <FormDescription>Format: YYYY-MM</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-between">
          <Button type="submit">
            {budget ? "Update Budget" : "Create Budget"}
          </Button>
          {budget && onDelete && (
            <Button type="button" variant="destructive" onClick={onDelete}>
              Delete Budget
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
