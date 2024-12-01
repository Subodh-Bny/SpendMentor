"use client";

import * as React from "react";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isBefore, startOfMonth } from "date-fns";

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
  isDateDisabled?: (date: Date) => boolean;
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

export function MonthYearPicker({
  value,
  onChange,
  isDateDisabled,
}: MonthYearPickerProps) {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = React.useState<number>(
    value ? value.getFullYear() : currentDate.getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = React.useState<number | null>(
    value ? value.getMonth() : null
  );

  const handlePreviousYear = () => {
    setSelectedYear(selectedYear - 1);
    setSelectedMonth(null);
  };

  const handleNextYear = () => {
    setSelectedYear(selectedYear + 1);
    setSelectedMonth(null);
  };

  const handleSelectMonth = (monthIndex: number) => {
    const newDate = new Date(selectedYear, monthIndex, 1);
    setSelectedMonth(monthIndex);
    onChange?.(newDate);
  };

  const isMonthDisabled = (monthIndex: number) => {
    const monthDate = new Date(selectedYear, monthIndex, 1);

    if (isDateDisabled && isDateDisabled(monthDate)) {
      return true;
    }

    if (selectedYear > currentDate.getFullYear()) {
      return false;
    }
    if (selectedYear < currentDate.getFullYear()) {
      return true;
    }
    return isBefore(monthDate, startOfMonth(currentDate));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "MMMM yyyy") : <span>Pick a month</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePreviousYear}
              disabled={selectedYear <= currentDate.getFullYear()}
              aria-label="Previous year"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">{selectedYear}</div>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNextYear}
              aria-label="Next year"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {months.map((month, index) => (
              <Button
                key={month}
                onClick={() => handleSelectMonth(index)}
                variant={selectedMonth === index ? "default" : "outline"}
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
