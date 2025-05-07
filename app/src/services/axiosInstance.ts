import axios from "axios";
// import { cookies } from "next/headers";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASEURL,
  headers: {
    "Content-Type": "application/json",
  },

  withCredentials: true,
});

// axiosInstance.interceptors.request.use(
//   async (config) => {
//     const cookiesStore = await cookies();
//     const token = cookiesStore.get("jwt");

//     if (token) {
//       config.headers["Authorization"] = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

export default axiosInstance;
