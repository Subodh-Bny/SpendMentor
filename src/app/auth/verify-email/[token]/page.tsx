"use client";
import LoadingPopup from "@/components/loading-popup";
import routes from "@/config/routes";
import { useVerifyEmail } from "@/services/api/authApi";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import toast from "react-hot-toast";

const VerifyEmail = ({ params }: { params: Promise<{ token: string }> }) => {
  const token = React.use(params).token;

  console.log("tokensss", token);
  const { isPending, isSuccess, isError } = useVerifyEmail({ token });

  const router = useRouter();
  useEffect(() => {
    if (isSuccess) {
      toast.success("Email verified");
      router.push(routes.auth.login);
    }
    if (isError) {
      toast.error("Email verification failed. Please, Send new email.");
      router.push(routes.auth.login);
    }
  }, [isSuccess, isError]);

  return <LoadingPopup isLoading={isPending} message="Verifying Email" />;
};

export default VerifyEmail;
