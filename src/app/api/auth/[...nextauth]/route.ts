import axiosInstance from "@/services/axiosInstance";
import endpoints from "@/services/endpoints";
import { IUser } from "@/types";
import { AxiosResponse } from "axios";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

interface ILoginResponse<T = unknown> {
  token?: string;
  data?: T;
  message: string;
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Sign in with credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "jsmith@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const res: AxiosResponse<ILoginResponse<IUser>> =
            await axiosInstance.post<ILoginResponse<IUser>>(
              endpoints.auth.login,
              credentials
            );

          const user = res.data?.data;

          if (res.status === 200 && user) {
            return {
              id: user.id || "",
              name: user.name,
              email: user.email,
            };
          }

          throw new Error(res.data?.message || "Failed to log in");
        } catch (error) {
          console.error("Unexpected error:", error);
          throw new Error("An unexpected error occurred");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add user data to the JWT
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        name: token.name,
        email: token.email,
      };
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/login",
  },
  debug: true,
});

export { handler as GET, handler as POST };
