import { AxiosError, AxiosResponse } from "axios";
import { requestError } from "./requestError";
import axiosInstance from "../axiosInstance";
import endpoints from "../endpoints";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import routes from "@/config/routes";

export const useSignup = () => {
  return useMutation({
    mutationFn: async (data: IUser) => {
      const response: AxiosResponse<IQueryResponse> =
        await axiosInstance.post<IApiResponse>(endpoints.auth.signup, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error) => {
      requestError(error as AxiosError<IApiResponse, unknown>);
    },
  });
};

interface ILoginResponse<T> extends IQueryResponse {
  data?: T;
  token?: string;
}

export const useLogin = () => {
  const router = useRouter();
  return useMutation({
    mutationFn: async (data: IUser) => {
      const response: AxiosResponse<ILoginResponse<IUser>> =
        await axiosInstance.post<IApiResponse>(endpoints.auth.login, data);
      return response.data;
    },
    onSuccess: (data) => {
      if (data.token) {
        toast.success(data.message);
        router.push(routes.dashboard.home);
      }
    },
    onError: (error) => {
      requestError(error as AxiosError<IApiResponse, unknown>);
    },
  });
};
