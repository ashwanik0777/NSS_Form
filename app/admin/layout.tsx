"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"

import ProtectedRoute from "@/components/auth/ProtectedRoute"
import AdminSidebar from "@/components/admin/AdminSidebar"
import { AdminLayoutContext } from "@/components/admin/AdminLayoutContext"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  useEffect(() => {
    if (status === "loading") return
    const user = session?.user as any
    // If user must change password and not already on set-password page, redirect
    if (user?.mustChangePassword && pathname !== "/set-password") {
      router.push("/set-password")
    }
  }, [session, status, router, pathname])

  return (
    <ProtectedRoute requiredRole="sub-admin">
      {/* Provide openMobileSidebar to all child AdminHeaders via context */}
      <AdminLayoutContext.Provider value={{ openMobileSidebar: () => setMobileOpen(true) }}>
        <div className="flex h-screen" style={{ background: "#f0f4f8" }}>
          {/* Sidebar */}
          <AdminSidebar
            mobileOpen={mobileOpen}
            onClose={() => setMobileOpen(false)}
          />

          {/* Main content — pages render their own AdminHeader which reads context */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      </AdminLayoutContext.Provider>
    </ProtectedRoute>
  )
}
