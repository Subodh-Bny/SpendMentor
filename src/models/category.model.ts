import mongoose, { Schema } from "mongoose";

const categorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true },
    user: { type: mongoose.Types.ObjectId, ref: "User" },
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

categorySchema.index({ name: 1, user: 1 }, { unique: true });

const Category =
  mongoose.models.Category ||
  mongoose.model<ICategory>("Category", categorySchema);

export default Category;
