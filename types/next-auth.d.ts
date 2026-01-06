declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      permissions: string[]
      hierarchy?: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: string
    permissions: string[]
    hierarchy?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string
    role: string
    permissions: string[]
    hierarchy?: string
  }
}
