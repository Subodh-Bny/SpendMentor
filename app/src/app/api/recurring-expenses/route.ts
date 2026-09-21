import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import RecurringExpense from "@/models/recurring-expense.model";

// GET  /api/recurring-expenses?userId=<id>
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    await dbConnect();
    const items = await RecurringExpense.find({ user: userId, is_active: true }).lean();
    return NextResponse.json({ success: true, data: items });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST /api/recurring-expenses  — add a new recurring expense
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, name, amount, priority_score, category } = body;
    if (!userId || !name || !amount) {
      return NextResponse.json({ error: "userId, name and amount are required" }, { status: 400 });
    }

    await dbConnect();
    const doc = await RecurringExpense.create({
      user: userId,
      name,
      amount: Number(amount),
      priority_score: Number(priority_score ?? 50),
      category: category ?? "Other",
    });
    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
