"use client";
import React from "react";
import { QueryProvider } from "./QueryProvider";

const AllContextProvider = ({ children }: { children: React.ReactNode }) => {
  return <QueryProvider>{children}</QueryProvider>;
};

export default AllContextProvider;
