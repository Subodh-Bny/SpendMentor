import dbConnect from "@/lib/dbConnect";
import { NextResponse } from "next/server";
import { validateAuth } from "./validateUser";
import Expense from "@/models/expenses.model";
import { internalError } from "./internalError";
import { format } from "date-fns";

export const generateHTMLReport = async (req: Request) => {
  if (req.method !== "GET") {
    return NextResponse.json(
      {
        message: "Method not allowed",
      },
      { status: 405 }
    );
  }

  try {
    await dbConnect();

    const authResult = await validateAuth();
    if (authResult instanceof NextResponse) {
      return authResult; // Unauthorized response
    }

    const { userId } = authResult;

    const expenses: IExpense[] = await Expense.find({
      user: userId,
    })
      .populate("category")
      .sort({ date: 1 });

    const totalExpenses = expenses?.reduce(
      (sum, acc) => (sum += Number(acc.amount)),
      0
    );

    const htmlContent = `
     <!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Expense Report</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        background-color: #f4f4f9;
      }
      .container {
        max-width: 1200px;
        margin: 2rem auto;
        padding: 1rem;
        background: #fff;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        border-radius: 8px;
      }
      h1 {
        text-align: center;
        margin-bottom: 1rem;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 1rem;
      }
      table th,
      table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }
      table th {
        background-color: #007bff;
        color: #fff;
      }
      .category-label {
        display: inline-block;
        padding: 0.3rem 0.6rem;
        font-size: 0.9rem;
        color: #fff;
        border-radius: 5px;
      }
      .category-rent {
        background-color: #ff6b6b;
      }
      .category-food {
        background-color: #4ecdc4;
      }
      .category-utilities {
        background-color: #ffd93d;
      }
      .category-transport {
        background-color: #3d84a8;
      }
      .category-other {
        background-color: #ac92ec;
      }
      .summary {
        display: flex;
        justify-content: space-between;
        padding: 1rem 0;
        background-color: #f9f9f9;
      }
      .summary div {
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Expense Report</h1>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Category</th>
            <th>Amount</th>
         
          </tr>
        </thead>
        <tbody>
        ${expenses
          ?.map(
            (expense) => `
            <tr>
              <td>${format(expense?.date, "dd LLL, yyyy")}</td>
              <td>${expense?.description}</td>
              <td>${
                typeof expense?.category === "object"
                  ? expense.category.name
                  : expense.category
              }</td>
              <td>Rs.${expense?.amount}</td>
            </tr>
          `
          )
          .join("")}
        </tbody>
      </table>
      <div class="summary">
        <div>Total Expenses: Rs. ${totalExpenses || 0}</div>
        <div>Total Entries: ${expenses?.length || 0}</div>
      </div>
    </div>
  </body>
</html>

    `;

    const response = new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    });

    return response;
  } catch (error) {
    return internalError("Error generating report", error);
  }
};

export default generateHTMLReport;
