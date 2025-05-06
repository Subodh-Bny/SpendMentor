import mongoose, { Schema } from "mongoose";
import crypto from "crypto";

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true, trim: true },
    isVerified: { type: Boolean, required: true, default: false },
    verificationToken: { type: String },
    verificationTokenExpire: { type: Date },
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

userSchema.methods.getVerificationToken = function () {
  // Generate a random verification token
  const token = crypto.randomBytes(20).toString("hex");

  // Hash the token before saving it to the database
  this.verificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Set token expiry to 30 minutes from now
  this.verificationTokenExpire = Date.now() + 30 * 60 * 1000; // 30 minutes

  return token;
};

const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default User;
