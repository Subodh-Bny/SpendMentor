import { useMutation } from "@tanstack/react-query";
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
      console.log(data);
      setUser(data.data);
      Cookie.set("user", JSON.stringify({ ...data.data }));
    },
    onError: (error) => {
      requestError(error as AxiosError<IApiResponse, unknown>);
    },
  });
};
