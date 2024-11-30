"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { savingsGoalSchema } from "@/lib/validations/savingGoals";
import {
  useCreateSavingsGoal,
  useGetSavingsGoal,
  useUpdateSavingsGoal,
} from "@/services/api/savingsGoalApi";
import { MonthYearPicker } from "../month-year-picker";
import { useState } from "react";

export function SavingsGoalForm() {
  const { data } = useGetSavingsGoal();
  const { mutate: createMutate } = useCreateSavingsGoal();
  const { mutate: updateMutate } = useUpdateSavingsGoal();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  console.log(data);
  console.log(selectedDate.toISOString());

  const form = useForm<z.infer<typeof savingsGoalSchema>>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: {
      action: "set",
      targetAmount: "",
      currentAmount: "",
      updateAmount: "",
    },
  });

  const watchAction = form.watch("action");

  function onSubmit(values: z.infer<typeof savingsGoalSchema>) {
    // Here you would typically send this data to your backend or state management system
    if (values.action === "update") {
      updateMutate({ ...values, targetDate: selectedDate });
    } else if (values.action === "set") {
      createMutate(
        { ...values, targetDate: selectedDate },
        {
          onSuccess: () => {
            form.reset();
          },
        }
      );
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 flex flex-col md:w-1/2"
      >
        <FormField
          control={form.control}
          name="action"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Action</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an action" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="set">Set New Goal</SelectItem>
                  <SelectItem value="update">Update Existing Goal</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose whether to set a new goal or update an existing one.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {watchAction === "set" && (
          <>
            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Savings Amount</FormLabel>
                  <FormControl>
                    <Input placeholder="5000" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter your target savings amount.
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
                  <FormLabel>Current Savings Amount</FormLabel>
                  <FormControl>
                    <Input placeholder="1000" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter your current savings amount.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {watchAction === "update" && (
          <FormField
            control={form.control}
            name="updateAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Update Amount</FormLabel>
                <FormControl>
                  <Input placeholder="100" {...field} />
                </FormControl>
                <FormDescription>
                  Enter the amount you want to add to your savings. Use a
                  negative number to decrease.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <MonthYearPicker
          value={selectedDate}
          onChange={(date) => setSelectedDate(date)}
        />
        <Button type="submit">
          {watchAction === "set" ? "Set Savings Goal" : "Update Savings Goal"}
        </Button>
      </form>
    </Form>
  );
}
