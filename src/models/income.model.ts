import mongoose, { Schema } from "mongoose";

const userIncomeSchema = new Schema<IUserIncome>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    income: { type: Number, required: true },
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

const UserIncome =
  mongoose.models.UserIncome ||
  mongoose.model<IUserIncome>("UserIncome", userIncomeSchema);

export default UserIncome;
