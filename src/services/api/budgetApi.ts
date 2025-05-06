import endpoints from "../endpoints";
import axiosInstance from "../axiosInstance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError, AxiosResponse } from "axios";
import toast from "react-hot-toast";
import { requestError } from "./requestError";

export const useSetBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["budget"],
    mutationFn: async (data: IBudget) => {
      const res: AxiosResponse<IQueryResponse<IBudget>> =
        await axiosInstance.post<IApiResponse>(endpoints.budget, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budget"] });
    },
    onError: (error) => {
      requestError(error as AxiosError<IApiResponse, unknown>);
    },
  });
};

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["budget"],
    mutationFn: async (data: IBudget) => {
      const res: AxiosResponse<IQueryResponse> =
        await axiosInstance.put<IApiResponse>(endpoints.budget + data.id, data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["budget"] });
    },
    onError: (error) => {
      requestError(error as AxiosError<IApiResponse, unknown>);
    },
  });
};

export const useDeleteBudget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["budget"],
    mutationFn: async (id: string) => {
      const res: AxiosResponse<IQueryResponse> =
        await axiosInstance.delete<IApiResponse>(endpoints.budget + id);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["budget"] });
    },
    onError: (error) => {
      requestError(error as AxiosError<IApiResponse, unknown>);
    },
  });
};

export const useGetBudgets = () => {
  return useQuery({
    queryKey: ["budget"],
    queryFn: async () => {
      const res: AxiosResponse<IQueryResponse<IBudget[]>> =
        await axiosInstance.get<IApiResponse>(endpoints.budget);
      return res.data?.data || [];
    },
  });
};

export const useGetBudgetById = ({ id }: { id: string }) => {
  return useQuery({
    queryKey: ["budget", id],
    queryFn: async () => {
      const res: AxiosResponse<IQueryResponse<IBudget>> =
        await axiosInstance.get<IApiResponse>(endpoints.budget + id);
      return (
        res.data?.data || {
          category: "",
          amount: 0,
          month: new Date().toISOString().slice(0, 7),
        }
      );
    },
  });
};
