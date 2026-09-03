import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import dbConnect from "./mongodb"
import User from "@/models/User"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        try {
          await dbConnect();
          // Only check DB, do not use .env
          // Case-insensitive email lookup
          const user = await User.findOne({ 
            email: { $regex: new RegExp(`^${credentials.email}$`, "i") } 
          });
          if (!user) return null;
          // Block removed/deactivated users from logging in
          if (user.status === "removed") return null;
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) return null;
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions,
            hierarchy: user.hierarchy,
            mustChangePassword: user.mustChangePassword,
            designation: user.designation,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role
        token.permissions = user.permissions
        token.hierarchy = (user as any).hierarchy
        token.mustChangePassword = (user as any).mustChangePassword
        token.designation = (user as any).designation
      }
      if (trigger === "update" && token?.sub) {
        try {
          await dbConnect()
          const refreshedUser = await User.findById(token.sub).select("role permissions hierarchy mustChangePassword designation")
          if (refreshedUser) {
            token.role = refreshedUser.role
            token.permissions = refreshedUser.permissions
            token.hierarchy = refreshedUser.hierarchy
            token.mustChangePassword = refreshedUser.mustChangePassword
            token.designation = refreshedUser.designation
          }
        } catch (error) {
          console.error("Error refreshing auth token:", error)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.permissions = token.permissions as string[]
        session.user.hierarchy = token.hierarchy as string
        ;(session.user as any).mustChangePassword = token.mustChangePassword as boolean
        ;(session.user as any).designation = token.designation as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
}
