import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import axiosInstance from "../axiosInstance";
import endpoints from "../endpoints";

export const useGetAnalytics = () => {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res: AxiosResponse<IQueryResponse<IAnalytics>> =
        await axiosInstance.get<IApiResponse>(endpoints.analytics);
      return res.data?.data || { expenses: [], budgets: [], categories: [] };
    },
  });
};
