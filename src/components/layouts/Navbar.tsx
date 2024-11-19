"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sun,
  Moon,
  CreditCard,
  Wallet,
  Goal,
  FileChartLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { signOut, useSession } from "next-auth/react";
import Image from "next/image";
import routes from "@/config/routes";

const NavLinks = [
  {
    link: routes.dashboard.expenses,
    name: "Expenses",
    icon: CreditCard,
  },

  {
    link: routes.dashboard.budget,
    name: "Budget",
    icon: Wallet,
  },

  {
    link: routes.dashboard.goals,
    name: "Goals",
    icon: Goal,
  },

  {
    link: routes.dashboard.reports,
    name: "Reports",
    icon: FileChartLine,
  },
];
const Navbar = () => {
  const { setTheme } = useTheme();

  const { data: session } = useSession();

  return (
    <nav className="bg-background border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href={routes.dashboard.home} className="flex-shrink-0">
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
                <Sheet>
                  <SheetTrigger>
                    <Avatar className="w-9 h-9">
                      <AvatarImage
                        src={
                          "https://avatar.iran.liara.run/username?username=" +
                          session?.user.name
                        }
                        className="w-9 h-9 rounded-full"
                      />
                      <AvatarFallback className="text-sm">USR</AvatarFallback>
                    </Avatar>
                  </SheetTrigger>
                  <SheetContent className="sm:w-[320px]">
                    <SheetHeader className="text-start">
                      <SheetTitle className="flex gap-2 items-center border-b pb-3">
                        <Avatar className="w-9 h-9">
                          <AvatarImage
                            src={
                              "https://avatar.iran.liara.run/username?username=" +
                              session?.user.name
                            }
                            className="w-9 h-9 rounded-full"
                          />
                          <AvatarFallback className="text-sm">
                            USR
                          </AvatarFallback>
                        </Avatar>

                        <span className="flex flex-col">
                          <span className="font-medium text-base mx-0">
                            {session?.user.name || "User"}
                          </span>
                          <span className="text-sm text-gray-500 font-normal w-[100px] sm:w-full text-ellipsis overflow-hidden">
                            {session?.user.email || ""}
                          </span>
                        </span>
                      </SheetTitle>
                    </SheetHeader>
                    <ul className="hover:cursor-pointer mt-3">
                      {NavLinks.map((link) => (
                        <li key={link.name}>
                          <Link
                            href={link.link}
                            className="flex gap-2 hover:bg-accent px-2 py-1 rounded-sm transition-all text-sm mt-1"
                          >
                            <link.icon size={20} />
                            {link.name}
                          </Link>
                        </li>
                      ))}
                      <hr className="mt-2" />
                      <li
                        onClick={() => signOut()}
                        className="text-red-500  hover:bg-accent px-2 py-1 rounded-sm transition-all mt-2"
                      >
                        Sign out
                      </li>
                    </ul>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
