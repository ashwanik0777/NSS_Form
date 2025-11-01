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
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) return null;
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions,
            mustChangePassword: user.mustChangePassword,
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
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.permissions = user.permissions
        token.mustChangePassword = (user as any).mustChangePassword
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.permissions = token.permissions as string[]
        ;(session.user as any).mustChangePassword = token.mustChangePassword as boolean
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
}
