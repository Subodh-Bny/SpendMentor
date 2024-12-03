"use client";
import React, { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { z } from "zod";
import { useChangePassword } from "@/services/api/userApi";
import LoadingPopup from "../loading-popup";

const passwordSchema = z.string().min(8);

const ChangePassword = () => {
  const [passwordError, setPasswordError] = useState<string | undefined>(
    undefined
  );
  const [currentPassword, SetCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { mutate: changePassword, isPending } = useChangePassword();

  const handleSubmit = () => {
    if (!passwordSchema.safeParse(newPassword).success) {
      setPasswordError("Password must contain atleast 8 words");
      return;
    }
    setPasswordError(undefined);
    changePassword(
      { newPassword, currentPassword },
      {
        onSuccess: () => {
          setNewPassword("");
          SetCurrentPassword("");
        },
      }
    );
  };
  return (
    <>
      <LoadingPopup isLoading={isPending} />
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            Change your password here. After saving, you&apos;ll be logged out.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="current">Current password</Label>
            <Input
              id="current"
              type="password"
              value={currentPassword}
              onChange={(e) => SetCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="new">New password</Label>
            <Input
              id="new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          {passwordError && (
            <p className="text-red-500 text-sm">{passwordError}</p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSubmit} disabled={isPending}>
            Save password
          </Button>
        </CardFooter>
      </Card>
    </>
  );
};

export default ChangePassword;
