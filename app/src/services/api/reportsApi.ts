import { useQuery } from "@tanstack/react-query";
import axiosInstance from "../axiosInstance";
import endpoints from "../endpoints";

export const useGenerateReports = () => {
  return useQuery({
    queryKey: ["report"],
    queryFn: async () => {
      const response = await axiosInstance.get(endpoints.reports);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
