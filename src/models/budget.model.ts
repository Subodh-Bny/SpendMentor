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

    user: { type: mongoose.Types.ObjectId, ref: "User", required: true },
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

budgetSchema.index({ user: 1, month: 1 });

const Budget =
  mongoose.models.Budget || mongoose.model<IBudget>("Budget", budgetSchema);

export default Budget;
