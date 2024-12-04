"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  CreditCard,
  Wallet,
  Goal,
  Blocks,
  LayoutDashboard,
  Settings,
  // X,
} from "lucide-react";
import { AuthContext } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import routes from "@/config/routes";
import { usePathname } from "next/navigation";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
// import { useGetUserIncome } from "@/services/api/userApi";

const links = [
  {
    link: routes.dashboard.home,
    name: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    link: routes.dashboard.expenses,
    name: "Expenses",
    icon: CreditCard,
  },
  {
    link: routes.dashboard.budget.overview,
    name: "Budget",
    icon: Wallet,
  },
  {
    link: routes.dashboard.goals,
    name: "Goals",
    icon: Goal,
  },
  {
    link: routes.dashboard.categories,
    name: "Categories",
    icon: Blocks,
  },
];

const Aside = () => {
  const { logout, user } = React.useContext(AuthContext);
  const [open, setOpen] = useState(false);
  // const [showIncomeTooltip, setShowIncomeTooltip] = useState(false);
  // const [isTooltipDismissed, setIsTooltipDismissed] = useState(false);
  // const { data: incomeData } = useGetUserIncome();
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // useEffect(() => {
  //   const tooltipDismissed =
  //     localStorage.getItem("incomeTooltipDismissed") === "true";
  //   setIsTooltipDismissed(tooltipDismissed);

  //   if ((!incomeData || incomeData.income <= 0) && !tooltipDismissed) {
  //     setShowIncomeTooltip(true);

  //     const timer = setTimeout(() => {
  //       setShowIncomeTooltip(false);
  //     }, 30000);

  //     return () => clearTimeout(timer);
  //   }
  // }, [incomeData]);

  const handleAvatarClick = () => {
    setOpen(true);
    // setShowIncomeTooltip(false);
    // localStorage.setItem("incomeTooltipDismissed", "true");
  };

  // const handleCloseIncomeTooltip = () => {
  //   setShowIncomeTooltip(false);
  //   localStorage.setItem("incomeTooltipDismissed", "true");
  // };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <div className="relative">
          {/* <TooltipProvider>
            <Tooltip open={showIncomeTooltip}>
              <TooltipTrigger asChild> */}
          <Avatar
            className="w-10 h-10 cursor-pointer"
            onClick={handleAvatarClick}
          >
            <AvatarImage
              src={`https://avatar.iran.liara.run/username?username=${user?.name}`}
              className="w-10 h-10 rounded-full"
            />
            <AvatarFallback className="text-sm">
              {user?.name?.slice(0, 2).toUpperCase() || "US"}
            </AvatarFallback>
          </Avatar>
          {/* </TooltipTrigger> */}
          {/* <TooltipContent
                side="left"
                sideOffset={5}
                className="flex items-center"
              >
                <X
                  size={15}
                  className="mr-2 cursor-pointer"
                  onClick={handleCloseIncomeTooltip}
                />
                <div className="mr-2">
                  Set your income for better recommendations.
                </div>
                <div className="w-3 h-3 bg-primary rotate-45 absolute -right-[0.30rem] top-1/2 -translate-y-1/2"></div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider> */}
        </div>
      </SheetTrigger>
      <SheetContent className="sm:w-[320px]">
        <SheetHeader className="text-start">
          <SheetTitle className="flex gap-2 items-center border-b pb-3">
            <Avatar className="w-9 h-9">
              <AvatarImage
                src={`https://avatar.iran.liara.run/username?username=${user?.name}`}
                className="w-9 h-9 rounded-full"
              />
              <AvatarFallback className="text-sm">
                {user?.name?.slice(0, 2).toUpperCase() || "US"}
              </AvatarFallback>
            </Avatar>
            <span className="flex flex-col">
              <span className="font-medium text-base mx-0">
                {user?.name || "User"}
              </span>
              <span className="text-sm text-gray-500 font-normal w-[100px] sm:w-full text-ellipsis overflow-hidden">
                {user?.email || "user@example.com"}
              </span>
            </span>
          </SheetTitle>
        </SheetHeader>
        <ul className="hover:cursor-pointer mt-3">
          {links.map((link) => (
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
          <li>
            <Link
              href={routes.settings}
              className="flex gap-2 hover:bg-accent px-2 py-1 rounded-sm transition-all text-sm mt-1"
            >
              <Settings size={20} />
              Settings
            </Link>
          </li>
          <hr className="mt-2" />
          <li
            className="text-red-500 hover:bg-accent px-2 py-1 rounded-sm transition-all mt-2 cursor-pointer"
            onClick={logout}
          >
            Sign out
          </li>
        </ul>
      </SheetContent>
    </Sheet>
  );
};

export default Aside;
