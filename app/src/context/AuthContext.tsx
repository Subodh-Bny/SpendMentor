"use client";

import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import Cookies from "js-cookie";
import { useLogout } from "@/services/api/authApi";

type AuthContextType = {
  isLoggedIn: boolean;
  user: IUser | undefined;
  setUser: Dispatch<SetStateAction<IUser | undefined>>;
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: undefined,
  setUser: () => {},

  setIsLoggedIn: () => {},
  logout: () => {},
});

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<IUser | undefined>(undefined);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { mutate: logoutMutate } = useLogout();

  useEffect(() => {
    const userData = Cookies.get("user");

    if (userData) {
      setIsLoggedIn(true);

      if (userData) {
        setUser(JSON.parse(userData));
      }
    } else {
      setIsLoggedIn(false);
    }
  }, []);

  const logout = () => {
    logoutMutate();
    Cookies.remove("user");
    setIsLoggedIn(false);
    setUser(undefined);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        setUser,
        setIsLoggedIn,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
