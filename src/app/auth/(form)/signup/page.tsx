"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { SubmitHandler, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import routes from "@/config/routes";
import { signupSchema } from "@/lib/validations/signup-schema";
import { useSignup } from "@/services/api/authApi";
import { useRouter } from "next/navigation";
import LoadingPopup from "@/components/loading-popup";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<IUser>();
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const { mutate: signup, isPending } = useSignup();

  const onSubmit: SubmitHandler<IUser> = (data) => {
    const validationResult = signupSchema.safeParse(data);
    if (validationResult.success) {
      signup(data, {
        onSuccess: () => {
          reset();
          router.push(routes.auth.login);
        },
      });
    } else {
      validationResult.error.errors.forEach((err) => toast.error(err.message));
    }
  };

  return (
    <>
      <LoadingPopup isLoading={isPending} message="Signing Up" />
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-primary dark:text-blue-300">
            Create an account
          </CardTitle>
          <CardDescription className="text-center text-primary/80 dark:text-blue-300/80">
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-blue-700 dark:text-blue-200"
              >
                Name
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="John Doe"
                required
                className="border-blue-200 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400"
              />
              {errors.name && (
                <p className="text-red-500">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-blue-700 dark:text-blue-200"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="john@example.com"
                required
                className="border-blue-200 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400"
              />
              {errors.email && (
                <p className="text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-blue-700 dark:text-blue-200"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Enter your password"
                  required
                  className="border-blue-200 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-400 hover:text-primary"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500">{errors.password.message}</p>
              )}
            </div>
            <CardFooter className="w-full p-0">
              <Button
                type="submit"
                className="bg-primary hover:bg-blue-700 text-white w-full"
              >
                Sign Up
              </Button>
            </CardFooter>
          </form>
        </CardContent>
        <div className="text-center pb-6">
          <span className="text-sm text-primary dark:text-blue-300">
            Already have an account?{" "}
            <a
              href={routes.auth.login}
              className="text-blue-700 hover:underline dark:text-blue-200"
            >
              Log in
            </a>
          </span>
        </div>
      </Card>
    </>
  );
}
