import { Document, Types } from "mongoose";

type IQueryResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

interface IApiResponse {
  success: boolean;
  message: string;
}

interface IUser extends Document {
  id?: string;
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}

interface IExpenses extends Document {
  id?: string;
  date: string;
  amount: number;
  category: Types.ObjectId;
  description?: string;
}
