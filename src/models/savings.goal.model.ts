import mongoose, { Schema } from "mongoose";

const savingsGoalSchema = new Schema<ISavingsGoal>(
  {
    targetAmount: { type: String, required: true },
    targetDate: {
      type: Date,
      required: true,
    },
    currentAmount: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
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

const SavingsGoal =
  mongoose.models.SavingsGoal ||
  mongoose.model<ISavingsGoal>("SavingsGoal", savingsGoalSchema);

export default SavingsGoal;
