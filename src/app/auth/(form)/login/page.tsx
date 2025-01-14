"use client";
import { useEffect, useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import Link from "next/link";
import routes from "@/config/routes";
import { useLogin, useSendVerificationAgain } from "@/services/api/authApi";
import { ClipLoader } from "react-spinners";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [verifyEmail, setVerifyEmail] = useState<string>("");
  const [verificationDialogOpen, setVerificationDialogOpen] =
    useState<boolean>(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const { mutate: login, isPending: loading } = useLogin();
  const { mutate: sendVerification, isPending: verificationEmailPending } =
    useSendVerificationAgain();

  useEffect(() => {
    if (!verificationEmailPending) setVerificationDialogOpen(false);
  }, [verificationEmailPending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    login(
      { email, password },
      {
        onSuccess: () => {
          setPassword("");
          setEmail("");
        },
      }
    );
  };

  const handleSendVerification = () => {
    sendVerification({ email: verifyEmail });
  };

  return (
    <>
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-blue-600 dark:text-blue-300">
            Welcome back
          </CardTitle>
          <CardDescription className="text-center text-blue-600/80 dark:text-blue-300/80">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit}>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  className="border-blue-200 dark:border-blue-700 focus:border-blue-500 dark:focus:border-blue-400"
                />

                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-400 hover:text-blue-600"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            <Button
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? <ClipLoader size={20} /> : "Log in"}
            </Button>
          </form>
          <div className="flex items-center justify-between">
            {/* <div className="flex items-center space-x-2">
              <Input
                id="remember"
                type="checkbox"
                className="w-4 h-4 border-blue-300 rounded text-blue-600 focus:ring-blue-500"
              />
              <Label
                htmlFor="remember"
                className="text-sm text-blue-600 dark:text-blue-300"
              >
                Remember me
              </Label>
            </div> */}

            <Dialog
              open={verificationDialogOpen}
              onOpenChange={setVerificationDialogOpen}
            >
              <DialogTrigger className="underline text-primary text-sm">
                Verify Email
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="mb-2">
                    Enter verification email
                  </DialogTitle>
                  <DialogDescription className="space-y-2">
                    <Input
                      id="remember"
                      type="email"
                      value={verifyEmail}
                      onChange={(e) => {
                        setVerifyEmail(e.target.value);
                      }}
                      className=" border-blue-300 rounded text-white focus:ring-blue-500"
                      placeholder="example@gmail.com"
                    />
                    <span className="flex w-full justify-between items-center">
                      <span>Check your email to verify.</span>
                      <Button
                        disabled={
                          verifyEmail === "" || verificationEmailPending
                        }
                        onClick={handleSendVerification}
                      >
                        {verificationEmailPending ? (
                          <ClipLoader size={15} />
                        ) : (
                          "Send"
                        )}
                      </Button>
                    </span>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center">
            <span className="text-sm text-blue-600 dark:text-blue-300">
              Don&apos;t have an account?{" "}
              <Link
                href={routes.auth.signUp}
                className="text-blue-700 hover:underline dark:text-blue-200"
              >
                Sign up
              </Link>
            </span>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}
