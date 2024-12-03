import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError, AxiosResponse } from "axios";
import axiosInstance from "../axiosInstance";
import toast from "react-hot-toast";
import { requestError } from "./requestError";
import endpoints from "../endpoints";
import { useContext } from "react";
import { AuthContext } from "@/context/AuthContext";
import Cookie from "js-cookie";

export const useUpdateUser = () => {
  const { setUser } = useContext(AuthContext);
  return useMutation({
    mutationFn: async (data: Partial<IUser>) => {
      const response: AxiosResponse<IQueryResponse<IUser>> =
        await axiosInstance.put<IApiResponse>(endpoints.user, data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      setUser(data.data);
      Cookie.set("user", JSON.stringify({ ...data.data }));
    },
    onError: (error) => {
      requestError(error as AxiosError<IApiResponse, unknown>);
    },
  });
};

interface IChangePassword {
  newPassword: string;
  currentPassword: string;
}

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: IChangePassword) => {
      const response: AxiosResponse<IQueryResponse<IUser>> =
        await axiosInstance.put<IApiResponse>(
          endpoints.user + "change-password/",
          data
        );
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

export const useSetIncome = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: IUserIncome) => {
      const response: AxiosResponse<IQueryResponse> =
        await axiosInstance.put<IApiResponse>(endpoints.user + "income/", data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["income"] });
    },
    onError: (error) => {
      requestError(error as AxiosError<IApiResponse, unknown>);
    },
  });
};

export const useGetUserIncome = () => {
  return useQuery({
    queryKey: ["income"],
    queryFn: async () => {
      const res: AxiosResponse<IQueryResponse<IUserIncome>> =
        await axiosInstance.get<IApiResponse>(endpoints.user + "income/");
      return res.data?.data || { income: "" };
    },
  });
};
