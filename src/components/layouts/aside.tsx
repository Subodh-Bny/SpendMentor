import React from "react";

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
} from "lucide-react";
import { AuthContext } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import routes from "@/config/routes";
import Link from "next/link";

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
  const { logout } = React.useContext(AuthContext);
  const { user } = React.useContext(AuthContext);
  return (
    <Sheet>
      <SheetTrigger>
        <Avatar className="w-9 h-9 animate-pulse">
          <AvatarImage
            src={
              "https://avatar.iran.liara.run/username?username=" + user?.name
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
                  user?.name
                }
                className="w-9 h-9 rounded-full"
              />
              <AvatarFallback className="text-sm">USR</AvatarFallback>
            </Avatar>

            <span className="flex flex-col">
              <span className="font-medium text-base mx-0">
                {user?.name || "User"}
              </span>
              <span className="text-sm text-gray-500 font-normal w-[100px] sm:w-full text-ellipsis overflow-hidden">
                {user?.name || "User"}
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
          <li
            className="text-red-500  hover:bg-accent px-2 py-1 rounded-sm transition-all mt-2"
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
