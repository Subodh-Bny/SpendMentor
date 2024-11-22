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
import routes from "@/config/routes";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-primary dark:text-blue-300">
          Create an account
        </CardTitle>
        <CardDescription className="text-center text-primary/80 dark:text-blue-300/80">
          Enter your details below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-blue-700 dark:text-blue-200">
            Name
          </Label>
          <Input
            id="name"
            placeholder="John Doe"
            required
            className="border-blue-200 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-blue-700 dark:text-blue-200">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            required
            className="border-blue-200 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400"
          />
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
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-primary hover:bg-blue-700 text-white">
          Sign Up
        </Button>
      </CardFooter>
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
  );
}
