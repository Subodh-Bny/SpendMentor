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
