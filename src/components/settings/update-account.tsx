"use client";
import React, { useContext, useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUpdateUser } from "@/services/api/userApi";
import { AuthContext } from "@/context/AuthContext";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { z } from "zod";
import LoadingPopup from "../loading-popup";

const Email = z.string().email();
const Name = z.string().min(2);

const UpdateAccount = () => {
  const { user } = useContext(AuthContext);
  const { mutate: updateAccountMutate, isPending } = useUpdateUser();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [errors, setErrors] = useState({ email: "", name: "" });

  useEffect(() => {
    setEmail(user?.email || "");
    setName(user?.name || "");
  }, [user]);

  const handleSubmit = () => {
    const newError = { name: "", email: "" };
    if (!Name.safeParse(name).success) {
      newError.name = "Name should contain minimum 2 letters";
      setErrors(newError);
      return;
    }
    if (!Email.safeParse(email).success) {
      newError.email = "Please enter valid email";
      setErrors(newError);
      return;
    }
    setErrors({ email: "", name: "" });
    updateAccountMutate({ name, email });
  };

  return (
    <>
      <LoadingPopup isLoading={isPending} />
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Make changes to your account here. Click save when you&apos;re done.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit}>Save changes</Button>
        </CardFooter>
      </Card>
    </>
  );
};

export default UpdateAccount;
