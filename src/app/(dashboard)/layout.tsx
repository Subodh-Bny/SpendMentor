import React from "react";
import Navbar from "@/components/layouts/navbar";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar />
      <main className="container max-w-6xl mx-auto py-10 px-4">{children}</main>
    </>
  );
};

export default layout;
