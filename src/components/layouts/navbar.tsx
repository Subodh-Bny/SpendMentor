"use client";
import * as React from "react";
import Link from "next/link";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useTheme } from "next-themes";
import Image from "next/image";
import routes from "@/config/routes";
import Aside from "./aside";

const Navbar = () => {
  const { setTheme } = useTheme();

  return (
    <nav className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href={routes.dashboard.home} className="flex-shrink-0 ">
              <span className="sr-only">SpendWise</span>
              <Image
                src={"/logo.svg"}
                width={75}
                height={75}
                priority
                alt="SpendWise logo"
              />
            </Link>
          </div>
          <div className="flex">
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                setTheme((prev) => (prev === "light" ? "dark" : "light"))
              }
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            <div>
              <div className="ml-4 flex items-center md:ml-6">
                <Aside />
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
