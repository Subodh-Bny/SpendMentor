import endpoints from "../endpoints";
import axiosInstance from "../axiosInstance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IApiResponse, ICategory, IQueryResponse } from "@/types/types";
import { AxiosError, AxiosResponse } from "axios";
import toast from "react-hot-toast";
import { requestError } from "./requestError";

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["category"],
    mutationFn: async (data: ICategory) => {
      const res: AxiosResponse<IQueryResponse<ICategory>> =
        await axiosInstance.post<IApiResponse>(endpoints.category, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["category"] });
    },
    onError: (error) => {
      requestError(error as AxiosError<IApiResponse, unknown>);
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["category"],
    mutationFn: async (data: ICategory) => {
      const res: AxiosResponse<IQueryResponse> =
        await axiosInstance.put<IApiResponse>(
          endpoints.category + data.id,
          data
        );
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["category"] });
    },
    onError: (error) => {
      requestError(error as AxiosError<IApiResponse, unknown>);
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["category"],
    mutationFn: async (id: string) => {
      const res: AxiosResponse<IQueryResponse> =
        await axiosInstance.delete<IApiResponse>(endpoints.category + id);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries({ queryKey: ["category"] });
    },
    onError: (error) => {
      requestError(error as AxiosError<IApiResponse, unknown>);
    },
  });
};

export const useGetCategories = () => {
  return useQuery({
    queryKey: ["category"],
    queryFn: async () => {
      const res: AxiosResponse<IQueryResponse<ICategory[]>> =
        await axiosInstance.get<IApiResponse>(endpoints.category + "user");
      return res.data?.data || [];
    },
  });
};
