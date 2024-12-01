import endpoints from "../endpoints";
import axiosInstance from "../axiosInstance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError, AxiosResponse } from "axios";
import toast from "react-hot-toast";
import { requestError } from "./requestError";

export const useCreateSavingsGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["savings-goal"],
    mutationFn: async (data: ISavingsGoal) => {
      console.log(data);
      const res: AxiosResponse<IQueryResponse> =
        await axiosInstance.post<IApiResponse>(endpoints.savingsGoal, data);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["savings-goal"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (error) => {
      requestError(error as AxiosError<IApiResponse, unknown>);
    },
  });
};

export const useUpdateSavingsGoal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["savings-goal"],
    mutationFn: async (data: ISavingsGoal) => {
      const res: AxiosResponse<IQueryResponse> =
        await axiosInstance.put<IApiResponse>(
          endpoints.savingsGoal + data.id,
          data
        );
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["savings-goal"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (error) => {
      requestError(error as AxiosError<IApiResponse, unknown>);
    },
  });
};

export const useDeleteSavingsGoal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["savings-goal"],
    mutationFn: async (id: string) => {
      const res: AxiosResponse<IQueryResponse> =
        await axiosInstance.delete<IApiResponse>(endpoints.savingsGoal + id);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["savings-goal"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (error) => {
      requestError(error as AxiosError<IApiResponse, unknown>);
    },
  });
};

export const useGetSavingsGoal = () => {
  return useQuery({
    queryKey: ["savings-goal"],
    queryFn: async () => {
      const res: AxiosResponse<IQueryResponse<ISavingsGoal[]>> =
        await axiosInstance.get<IApiResponse>(endpoints.savingsGoal);
      return res.data?.data || [];
    },
  });
};
