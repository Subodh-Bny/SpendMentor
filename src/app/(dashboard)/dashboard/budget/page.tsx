import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import React from "react";
import BudgetList from "./budget-list";

const BudgetPage = () => {
  return (
    <div className="space-y-4">
      <section>
        <h1 className="text-3xl font-bold mb-3">Budget Overview</h1>
        <Link
          href={"/"}
          className={`${buttonVariants({ variant: "default" })} text-white`}
        >
          Add Budget
        </Link>
      </section>
      <section className="space-y-4">
        <BudgetList />
      </section>
    </div>
  );
};

export default BudgetPage;
