import mongoose, { Schema } from "mongoose";

const budgetSchema = new Schema<IBudget>(
  {
    category: {
      type: mongoose.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    amount: { type: Number, required: true },
    month: { type: String, required: true },
    spent: { type: Number, default: 0 },
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

const Budget =
  mongoose.models.Budget || mongoose.model<IBudget>("Budget", budgetSchema);

export default Budget;
