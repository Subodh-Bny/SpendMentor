"use client";
import React from "react";
import { QueryProvider } from "./QueryProvider";
import { AuthContextProvider } from "./AuthContext";

const AllContextProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <QueryProvider>
      <AuthContextProvider>{children}</AuthContextProvider>
    </QueryProvider>
  );
};

export default AllContextProvider;
