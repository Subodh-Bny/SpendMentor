type IQueryResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
};

interface RequestWithUser extends NextRequest {
  user?: JWTVerifyResult<JWTPayload>;
}

interface IApiResponse {
  success: boolean;
  message: string;
}

interface IUser {
  id?: string;
  name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
  isVerified?: boolean;
  verificationToken?: string;
  verificationTokenExpire?: Date;
}

interface ICategory {
  id?: string;
  name: string;
  user?: string;
}
interface IExpense {
  id?: string;
  date: Date;
  amount: string;
  user?: string | IUser;
  category: string | ICategory;
  description?: string;
}

interface IBudget {
  id?: string;
  category: string | ICategory;
  amount: number;
  month: string;
  spent?: number;
  user?: string | IUser;
}

interface IAnalytics {
  expenses: IExpense[];
  budgets: IBudget[];
  categories: ICategory[];
}

interface ISavingsGoal {
  id?: string;
  targetAmount: string;
  currentAmount: string;
  targetDate: Date;
  updateAmount?: string;
  user?: string | IUser;
}

interface IUserIncome {
  user?: string | IUser;
  income: number;
}

interface IRecommendation {
  similarityScore: number;
  recommendations: string[];
}

interface IPrediction {
  user_id: string;
  prediction_date: string;
  categories: string[];
  predicted_amounts: {
    Clothes: number;
    Food: number;
    Transport: number;
  };
  based_on_months: number;
}
