import { useQuery } from "@tanstack/react-query";
import axios, { AxiosResponse } from "axios";

export const useExpensePrediction = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["prediction", userId],
    queryFn: async () => {
      const response: AxiosResponse<IPrediction> = await axios.post(
        `${process.env.NEXT_PUBLIC_LSTM_URL}${userId}`
      );
      return response.data ?? null; // Return null if no data
    },
  });
};

// export const useTrainModel = (userId: string | undefined) => {
//   return useQuery({
//     queryKey: ["trainModel", userId],
//     queryFn: async () => {
//       const response: AxiosResponse<IPrediction> = await axios.post(
//         `${process.env.NEXT_PUBLIC_LSTM_TRAIN_URL}${userId}`
//       );
//       console.log(response.data);
//       return response.data ?? null; // Return null if no data
//     },
//   });
// };
