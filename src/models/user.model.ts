import { IUser } from "@/types";
import mongoose, { Schema } from "mongoose";

const userSchema = new Schema<IUser>(
  {
    name: { type: String, require: true },
    email: {
      type: String,
      unique: true,
      require: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, require: true, trim: true },
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

const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
