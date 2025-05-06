import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex gap-2 items-center justify-center  p-4 flex-col">
      <h1 className="text-4xl font-bold text-primary">SpendMentor.</h1>

      {children}
    </div>
  );
};

export default layout;
