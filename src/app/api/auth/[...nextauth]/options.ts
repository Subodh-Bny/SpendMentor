import dbConnect from "@/lib/dbConnect";
import User from "@/models/user.model";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "jsmith@example.com",
        },
        password: { label: "Password", type: "password" },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async authorize(credentials: any) {
        await dbConnect();
        if (!credentials) {
          throw new Error("Credentials are required");
        }
        console.log("cred");
        try {
          console.log("bef user");
          const user = await User.findOne({
            email: credentials.email,
          });

          if (!user) {
            console.log("user err");
            throw new Error("Invalid email or password.");
          }

          console.log("user");

          const isPasswordCorrect = await bcryptjs.compare(
            credentials.password,
            user.password
          );

          console.log("passcorrect ");
          if (isPasswordCorrect) {
            console.log("pass");

            return user;
          } else {
            console.log("pass err");
            throw new Error("Incorrect password");
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          console.log("err");
          throw new Error(
            error.response?.data?.message || "An unexpected error occurred"
          );
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.user) {
        console.log("session, token");
        session.user = {
          id: token.user.id,
          name: token.user.name,
          email: token.user.email,
          token: token.toString(),
        };
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        console.log("Before setting token.user:", token, user);
        token.user = {
          id: user.id?.toString() || "",
          name: user.name || "",
          email: user.email || "",
        };
      } else if (!token.user) {
        token.user = {
          id: "",
          name: "",
          email: "",
        };
      }
      console.log("After setting token.user:", token);
      return token;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
