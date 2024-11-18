import { AxiosError, AxiosResponse } from "axios";
import { requestError } from "./requestError";
import { IApiResponse, IQueryResponse, IUser } from "@/types";
import axiosInstance from "../axiosInstance";
import endpoints from "../endpoints";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface ILoginResponse<T = unknown> extends IQueryResponse {
  token?: string;
  data?: T;
}

export const useLogin = () => {
  return useMutation({
    mutationFn: async (data: IUser) => {
      const response: AxiosResponse<ILoginResponse<IUser>> =
        await axiosInstance.post<IApiResponse>(endpoints.auth.login, data);
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
