import React from "react";
import Navbar from "@/components/layouts/Navbar";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Navbar />
      <main className="">{children}</main>
    </>
  );
};

export default layout;
