import React from "react";
import Link from "next/link";

import { ArrowRightCircle } from "lucide-react";

const ArrowLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  return (
    <Link href={href} className="grid  grid-cols-2 items-center gap-2">
      {children} <ArrowRightCircle size={20} />
    </Link>
  );
};

export default ArrowLink;
