import mongoose from "mongoose";
import "@/models/budget.model";
import "@/models/category.model";
import "@/models/user.model";
import "@/models/expenses.model";
import "@/models/savings.goal.model";
import "@/models/income.model";
import "@/models/recurring-expense.model";


const MONGODB_URI = process.env.DATABASE_URL as string;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the DATABASE_URL environment variable in .env.local"
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { connection: null, promise: null };
}

const dbConnect = async (): Promise<void> => {
  if (cached.connection && mongoose.connection.readyState === 1) {
    console.log("Using cached connection");
    return;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.connection = await cached.promise;
    console.log("Connected to the Database");
  } catch (error) {
    cached.promise = null;
    cached.connection = null;
    throw error;
  }
};

export default dbConnect;
