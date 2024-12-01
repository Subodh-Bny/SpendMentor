import React, { Dispatch, SetStateAction } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { months } from "@/lib/data";

const MonthSelector = ({
  setMonth,
}: {
  setMonth: Dispatch<SetStateAction<number>>;
}) => {
  return (
    <Select
      defaultValue={new Date().getMonth().toString()}
      onValueChange={(value) => setMonth(Number(value))}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select Month" />
      </SelectTrigger>
      <SelectContent className="h-56">
        {months.map((month) => (
          <SelectItem key={month.value} value={month.value}>
            {month.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default MonthSelector;
