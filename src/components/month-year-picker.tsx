"use client";

import * as React from "react";
import { Calendar1, ChevronLeft, ChevronRight } from "lucide-react";
import { addYears, subYears, format, isBefore, startOfMonth } from "date-fns";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MonthYearPickerProps {
  value?: Date;
  onChange?: (date: Date) => void;
}

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function MonthYearPicker({ value, onChange }: MonthYearPickerProps) {
  const [date, setDate] = React.useState(value || new Date());
  const currentDate = new Date();

  const handlePreviousYear = () => {
    setDate((prevDate) => subYears(prevDate, 1));
  };

  const handleNextYear = () => {
    setDate((prevDate) => addYears(prevDate, 1));
  };

  const handleSelectMonth = (monthIndex: number) => {
    const newDate = new Date(date.getFullYear(), monthIndex, 1);
    setDate(newDate);
    onChange?.(newDate);
  };

  const isMonthDisabled = (monthIndex: number) => {
    if (date.getFullYear() > currentDate.getFullYear()) {
      return false;
    }
    if (date.getFullYear() < currentDate.getFullYear()) {
      return true;
    }
    return isBefore(
      new Date(date.getFullYear(), monthIndex),
      startOfMonth(currentDate)
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          {value ? format(value, "MMMM yyyy") : <span>Pick a month</span>}
          <Calendar1 className="ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousYear}
              disabled={date.getFullYear() <= currentDate.getFullYear()}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous year</span>
            </Button>
            <div className="text-sm font-medium">{date.getFullYear()}</div>
            <Button variant="outline" size="icon" onClick={handleNextYear}>
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next year</span>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {months.map((month, index) => (
              <Button
                key={month}
                onClick={() => handleSelectMonth(index)}
                variant={date.getMonth() === index ? "default" : "outline"}
                className="text-sm"
                disabled={isMonthDisabled(index)}
              >
                {month}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
