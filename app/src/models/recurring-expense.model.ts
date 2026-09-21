import mongoose, { Schema, Document } from "mongoose";

export interface IRecurringExpense extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  amount: number;           // monthly amount in NPR
  priority_score: number;   // 1–100, higher = more essential
  category: string;         // label e.g. "Subscription", "Health", "Food"
  is_active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const recurringExpenseSchema = new Schema<IRecurringExpense>(
  {
    user:           { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name:           { type: String, required: true, trim: true },
    amount:         { type: Number, required: true, min: 0 },
    priority_score: { type: Number, required: true, min: 1, max: 100, default: 50 },
    category:       { type: String, default: "Other" },
    is_active:      { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
    toObject: { virtuals: true },
  }
);

const RecurringExpense =
  mongoose.models.RecurringExpense ||
  mongoose.model<IRecurringExpense>("RecurringExpense", recurringExpenseSchema);

export default RecurringExpense;
