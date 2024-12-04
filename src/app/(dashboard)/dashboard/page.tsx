"use client";
import BudgetVsActual from "@/components/dashboard/budget-vs-actual";
import CategoryBreakdown from "@/components/dashboard/category-breakdown";
import ExpenseOverview from "@/components/dashboard/expense-overview";
import SavingsGoal from "@/components/dashboard/savings-goal";
import { SpendingRecommendation } from "@/components/dashboard/spending-recommendation";
import SpendingTrends from "@/components/dashboard/spending-trends";
import { Button } from "@/components/ui/button";
import { useGenerateReports } from "@/services/api/reportsApi";
import { useGetRecommendation } from "@/services/api/userApi";
import { Download } from "lucide-react";
import React, { useRef } from "react";

const DashboardPage = () => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const { data } = useGenerateReports();
  const { data: recommendations } = useGetRecommendation();
  const handleReportDownload = () => {
    if (data && iframeRef.current) {
      const iframeDoc =
        iframeRef.current.contentDocument ||
        iframeRef.current.contentWindow?.document;

      if (iframeDoc) {
        // Open the iframe document, write the data (HTML content), then close it
        iframeDoc.open();
        iframeDoc.write(data); // Assuming data is the HTML content
        iframeDoc.close();

        // Trigger the print dialog for the iframe
        iframeRef.current.focus();
        iframeRef.current.contentWindow?.print();
      }
    }
  };
  return (
    <>
      <div className="relative space-y-3">
        <div className="flex justify-between">
          <h1 className="text-3xl font-bold mb-3">Dashboard</h1>
          <Button onClick={handleReportDownload}>
            <Download />
            Expenses report
          </Button>
        </div>
        <iframe ref={iframeRef} style={{ display: "none" }} />

        <section className="grid gap-4  md:grid-cols-3">
          <ExpenseOverview />
          <BudgetVsActual />
          <SavingsGoal />
        </section>
        <section>
          <CategoryBreakdown />
        </section>
        <section>
          <SpendingRecommendation
            similarityScore={recommendations?.similarityScore || 0}
            recommendations={recommendations?.recommendations || ""}
          />
        </section>
        <section>
          <SpendingTrends />
        </section>
      </div>
    </>
  );
};

export default DashboardPage;
