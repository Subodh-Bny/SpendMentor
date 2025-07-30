/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { Dispatch, SetStateAction, useContext, useEffect } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { expenseSchema, ExpenseInput } from "@/lib/validations/expense";
import { useAddExpense, useUpdateExpense } from "@/services/api/expenseApi";
import { ClipLoader } from "react-spinners";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateCategory,
  useGetCategories,
} from "@/services/api/categoryApi";

import toast from "react-hot-toast";
import { AuthContext } from "@/context/AuthContext";
import axiosInstance from "@/services/axiosInstance";

export default function AddExpense({
  open,
  setOpen,
  expense,
  setExpense,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  setExpense: Dispatch<SetStateAction<IExpense | undefined>>;
  expense?: IExpense;
}) {
  const { data: categories } = useGetCategories();
  const { user } = useContext(AuthContext);

  const form = useForm<ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      id: "",

      description: "",
      amount: "0",
      date: new Date(),
      category: "",
      newCategory: "",
    },
  });

  const {
    mutate: addExpense,
    isPending: addExpensePending,
    error: addExpenseError,
  } = useAddExpense();
  const {
    mutate: updateExpense,
    isPending: updateExpensePending,
    error: updateExpenseError,
  } = useUpdateExpense();
  const {
    mutate: createCategory,
    isPending: createCategoryPending,
    error: createCategoryError,
  } = useCreateCategory();

  const isLoading =
    addExpensePending || createCategoryPending || updateExpensePending;

  const resetFormValues = () => {
    if (expense) {
      form.reset({
        id: expense.id,
        description: expense.description || "",
        amount: expense.amount.toString(),
        date: new Date(expense.date),
        category:
          typeof expense.category === "object"
            ? expense.category.id
            : expense.category,
        newCategory: "",
      });
    } else {
      form.reset({
        description: "",
        amount: "0",
        date: new Date(),
        category: "",
        newCategory: "",
      });
    }
  };

  useEffect(() => {
    resetFormValues();
  }, [expense]);

  useEffect(() => {
    if (addExpenseError || createCategoryError || updateExpenseError) {
      toast.error(
        addExpenseError?.message ||
          createCategoryError?.message ||
          updateExpenseError?.message ||
          "Something went wrong!"
      );
    }
  }, [addExpenseError, createCategoryError, updateExpenseError]);

  useEffect(() => {
    if (
      !isLoading &&
      !addExpenseError &&
      !createCategoryError &&
      !updateExpenseError
    ) {
      setOpen(false);
      form.reset();
    }
  }, [
    isLoading,
    addExpenseError,
    createCategoryError,
    updateExpenseError,
    setOpen,
  ]);

  const handleOpenChange = () => {
    setOpen(false);
    setExpense(undefined);
  };

  const handleSaveExpense = (values: ExpenseInput) => {
    if (expense) {
      updateExpense(values, {
        onSuccess: async () => {
          if (user?.id) {
            await axiosInstance.post(
              `${process.env.NEXT_PUBLIC_LSTM_TRAIN_URL}${user.id}`
            );
          }
        },
      });
    } else {
      addExpense(values, {
        onSuccess: async () => {
          if (user?.id) {
            await axiosInstance.post(
              `${process.env.NEXT_PUBLIC_LSTM_TRAIN_URL}${user.id}`
            );
          }
        },
      });
    }
    form.reset();
  };

  async function onSubmit(values: ExpenseInput) {
    const utcDate = new Date(
      Date.UTC(
        values.date.getFullYear(),
        values.date.getMonth(),
        values.date.getDate()
      )
    );
    if (values.category === "other" && values.newCategory) {
      createCategory(
        { name: values.newCategory },
        {
          onSuccess: (response) => {
            const newCategoryId = response?.data?.id || "";

            handleSaveExpense({
              ...values,
              date: utcDate,
              category: newCategoryId,
            });
          },
          onError: (error) => {
            toast.error(error.message || "Failed to create category.");
          },
        }
      );
    } else {
      handleSaveExpense({ ...values, date: utcDate });
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>
              Enter the details of your new expense here. Click save when
              you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Groceries" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover modal>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories?.map((category) => (
                          <SelectItem
                            key={category.id}
                            value={category?.id || ""}
                          >
                            {category.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("category") === "other" && (
                <FormField
                  control={form.control}
                  name="newCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter new category" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {/* <FormField
              control={form.control}
              name="user"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User</FormLabel>
                  <FormControl>
                    <Input placeholder="User ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <ClipLoader size={15} /> : "Save Expense"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
