import { useState } from "react";
import { signIn } from "next-auth/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import routes from "@/config/routes";

const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const login = async (email: string, password: string) => {
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.ok) {
      toast.success("Logged in");
      router.push(routes.auth.signUp);
    }
    if (res?.error) {
      if (res.status === 401) {
        toast.error("Invalid email or password");
      } else {
        toast.error(res.error);
      }
    }
    setLoading(false);

    return res;
  };

  return { login, loading };
};

export default useLogin;
