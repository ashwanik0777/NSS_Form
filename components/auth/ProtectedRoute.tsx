"use client"

import type React from "react"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { hasPermission, type PermissionKey } from "@/lib/permissions"

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: "admin" | "sub-admin" | "volunteer" | "user"
  requiredPermission?: PermissionKey
  fallbackUrl?: string
}

export default function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallbackUrl = "/login",
}: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push(fallbackUrl)
      return
    }

    // Check role requirement
    if (requiredRole) {
      const userRole = session.user.role
      if (requiredRole === "volunteer") {
        // For volunteer route, user must be volunteer
        if (userRole !== "volunteer" && userRole !== "user") {
          router.push("/unauthorized")
          return
        }
      } else {
        const allowedRoles = ["admin", "sub-admin", "user"]
        const requiredRoleIndex = allowedRoles.indexOf(requiredRole)
        const userRoleIndex = allowedRoles.indexOf(userRole)

        if (userRoleIndex > requiredRoleIndex) {
          router.push("/unauthorized")
          return
        }
      }
    }

    // Check permission requirement (admin users bypass permission checks)
    if (requiredPermission) {
      const userRole = session.user.role
      if (userRole !== "admin") {
        const userPermissions = session.user.permissions || []
        if (!hasPermission(userPermissions, requiredPermission)) {
          router.push("/unauthorized")
          return
        }
      }
    }
  }, [session, status, router, requiredRole, requiredPermission, fallbackUrl])

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null // Will redirect
  }

  // Check role and permission again before rendering
  if (requiredRole) {
    const userRole = session.user.role
    if (requiredRole === "volunteer") {
      // For volunteer route, user must be volunteer
      if (userRole !== "volunteer" && userRole !== "user") {
        return null // Will redirect
      }
    } else {
      const allowedRoles = ["admin", "sub-admin", "user"]
      const requiredRoleIndex = allowedRoles.indexOf(requiredRole)
      const userRoleIndex = allowedRoles.indexOf(userRole)

      if (userRoleIndex > requiredRoleIndex) {
        return null // Will redirect
      }
    }
  }

  // Admin users bypass permission checks
  if (requiredPermission) {
    const userRole = session.user.role
    if (userRole !== "admin") {
      const userPermissions = session.user.permissions || []
      if (!hasPermission(userPermissions, requiredPermission)) {
        return null // Will redirect
      }
    }
  }

  return <>{children}</>
}
