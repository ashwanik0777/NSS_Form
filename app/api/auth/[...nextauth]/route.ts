import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials) return null

        const envEmail = process.env.Email
        const envPass = process.env.Password

        if (credentials.email === envEmail && credentials.password === envPass) {
          // return a user object — include role
          return {
            id: "admin-1",
            name: "NSS Admin",
            email: envEmail,
            role: "admin",
          }
        }

        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // copy role from user into token
        ;(token as any).role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      // expose role on session.user
      ;(session.user as any).role = (token as any).role
      return session
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
