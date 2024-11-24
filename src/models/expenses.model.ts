import mongoose, { Schema } from "mongoose";

const expenseSchema = new Schema<IExpense>(
  {
    date: { type: Date, require: true },
    amount: {
      type: String,
      require: true,
      trim: true,
    },
    description: { type: String },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", require: true },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = ret._id;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

const Expense =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", expenseSchema);

export default Expense;
