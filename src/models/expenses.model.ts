import { IExpenses } from "@/types/types";
import mongoose, { Schema } from "mongoose";

const expenseSchema = new Schema<IExpenses>(
  {
    date: { type: Date, require: true },
    amount: {
      type: String,
      require: true,
      trim: true,
    },
    description: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

const Expense =
  mongoose.models.Expense ||
  mongoose.model<IExpenses>("Expense", expenseSchema);

export default Expense;
