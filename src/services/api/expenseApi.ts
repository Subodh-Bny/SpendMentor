import endpoints from "../endpoints";
import axiosInstance from "../axiosInstance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IApiResponse, IExpenses, IQueryResponse } from "@/types/types";
import { AxiosError, AxiosResponse } from "axios";
import toast from "react-hot-toast";
import { requestError } from "./requestError";

export const useAddExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["expense"],
    mutationFn: async (data: IExpenses) => {
      const res: AxiosResponse<IQueryResponse> =
        await axiosInstance.post<IApiResponse>(endpoints.expense, data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["expense"] });
    },
    onError: (error) => {
      requestError(error as AxiosError<IApiResponse, unknown>);
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["expense"],
    mutationFn: async (data: IExpenses) => {
      const res: AxiosResponse<IQueryResponse> =
        await axiosInstance.put<IApiResponse>(
          endpoints.expense + data.id,
          data
        );
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["expense"] });
    },
    onError: (error) => {
      requestError(error as AxiosError<IApiResponse, unknown>);
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["expense"],
    mutationFn: async (id: string) => {
      const res: AxiosResponse<IQueryResponse> =
        await axiosInstance.delete<IApiResponse>(endpoints.expense + id);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["expense"] });
    },
    onError: (error) => {
      requestError(error as AxiosError<IApiResponse, unknown>);
    },
  });
};

export const useGetExpenses = () => {
  return useQuery({
    queryKey: ["expense"],
    queryFn: async () => {
      const res: AxiosResponse<IQueryResponse<IExpenses>> =
        await axiosInstance.get<IApiResponse>(endpoints.expense);
      return res.data;
    },
  });
};
