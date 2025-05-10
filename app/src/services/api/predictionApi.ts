import { useQuery } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";

export const useExpensePrediction = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["prediction", userId],
    queryFn: async () => {
      console.log(userId);
      const response: AxiosResponse<IPrediction> = await axios.get(
        `${process.env.NEXT_PUBLIC_LSTM_URL}${userId}`
      );
      console.log(response.data);
      return response.data ?? null; // Return null if no data
    },
  });
};
