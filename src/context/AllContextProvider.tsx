"use client";
import { SessionProvider } from "next-auth/react";
import React from "react";
import { QueryProvider } from "./QueryProvider";

const AllContextProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SessionProvider>
      <QueryProvider>{children}</QueryProvider>
    </SessionProvider>
  );
};

export default AllContextProvider;
