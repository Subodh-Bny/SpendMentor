"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { z } from "zod";
import { useGetUserIncome, useSetIncome } from "@/services/api/userApi";
import LoadingPopup from "../loading-popup";

const SetIncomeSchema = z.object({
  income: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Income must be a non-negative number",
  }),
});

export default function SetIncome() {
  const [income, setIncome] = useState("");
  const [incomeError, setIncomeError] = useState<string | undefined>(undefined);
  const { mutate: setIncomeMutate, isPending } = useSetIncome();
  const { data: incomeData } = useGetUserIncome();

  useEffect(() => {
    if (incomeData) setIncome(incomeData?.income?.toString() || "");
  }, [incomeData]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIncomeError(undefined);

    const validatedFields = SetIncomeSchema.safeParse({ income });

    if (!validatedFields.success) {
      setIncomeError(
        validatedFields.error.flatten().fieldErrors?.income?.[0] ||
          "Invalid income"
      );
      return;
    }

    const userIncome = Number(validatedFields.data.income);
    setIncomeMutate({ income: userIncome });
  };

  return (
    <>
      <LoadingPopup isLoading={isPending} />
      <Card>
        <CardHeader>
          <CardTitle>Set Your Income</CardTitle>
          <CardDescription>
            Enter your monthly income below for better recommendations on your
            budget management
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="income">Annual Income</Label>
                <Input
                  id="income"
                  name="income"
                  placeholder="Enter your income"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className={incomeError ? "border-red-500" : ""}
                  required
                />
              </div>
              {incomeError && (
                <p className="text-center text-red-500">{incomeError}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="submit">Set Income</Button>
          </CardFooter>
        </form>
      </Card>
    </>
  );
}
