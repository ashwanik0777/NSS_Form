"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Menu } from "lucide-react"

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
  const [hasPageHeader, setHasPageHeader] = useState(false)

  // Close mobile drawer on route change & reset page header indicator
  useEffect(() => {
    setMobileOpen(false)
    setHasPageHeader(false)
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

  const getAdminPageTitle = (path: string) => {
    if (path === "/admin") return "Dashboard"
    if (path.startsWith("/admin/applications")) return "Applications"
    if (path.startsWith("/admin/volunteers/manage")) return "Manage Volunteer Data"
    if (path.startsWith("/admin/volunteers")) return "Volunteers"
    if (path.startsWith("/admin/past-volunteers")) return "Past Volunteers"
    if (path.startsWith("/admin/users")) return "User Management"
    if (path.startsWith("/admin/projects")) return "Projects"
    if (path.startsWith("/admin/events")) return "Events"
    if (path.startsWith("/admin/attendance/manual")) return "Manual Attendance"
    if (path.startsWith("/admin/attendance")) return "Attendance Review"
    if (path.startsWith("/admin/meetings")) return "Meetings"
    if (path.startsWith("/admin/announcements")) return "Announcements"
    if (path.startsWith("/admin/social-posts")) return "Social Media Posts"
    if (path.startsWith("/admin/social-links")) return "Social Links"
    if (path.startsWith("/admin/grievances")) return "Grievances"
    if (path.startsWith("/admin/reports")) return "Reports & Issues"
    if (path.startsWith("/admin/emailSystem")) return "Email System"
    if (path.startsWith("/admin/profile")) return "My Profile"
    if (path.startsWith("/admin/system/password-reset")) return "Password Reset"
    return "Admin Panel"
  }

  return (
    <ProtectedRoute requiredRole="sub-admin">
      <AdminLayoutContext.Provider
        value={{
          openMobileSidebar: () => setMobileOpen(true),
          hasPageHeader,
          setHasPageHeader,
        }}
      >
        <div className="flex h-screen bg-[#f0f4f8] dark:bg-background text-foreground transition-colors duration-200">
          {/* Sidebar */}
          <AdminSidebar
            mobileOpen={mobileOpen}
            onClose={() => setMobileOpen(false)}
          />

          {/* Main content area */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Universal Mobile Header - shown on mobile whenever page has no dedicated AdminHeader */}
            {!hasPageHeader && (
              <header className="md:hidden flex items-center justify-between px-3.5 py-3 bg-white border-b border-slate-200/80 shadow-xs z-30 shrink-0 sticky top-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <button
                    onClick={() => setMobileOpen(true)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all duration-150 active:scale-95 shrink-0"
                    aria-label="Open admin navigation menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2 min-w-0">
                    <img src="/nssLogo.png" alt="NSS Logo" className="w-7 h-7 object-contain shrink-0" />
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-slate-900 block leading-tight truncate">
                        NSS Admin
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium block leading-tight truncate">
                        {getAdminPageTitle(pathname)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href="/admin/profile"
                    className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                    title="My Profile"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shadow-xs">
                      {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "A"}
                    </div>
                  </Link>
                </div>
              </header>
            )}

            <main className="flex-1 overflow-y-auto scroll-smooth overscroll-contain transition-colors duration-200">
              {children}
            </main>

            {/* Persistent Floating Mobile Menu Pill (below md) */}
            <div className="md:hidden fixed bottom-5 right-5 z-40">
              <button
                onClick={() => setMobileOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium text-xs rounded-full shadow-lg shadow-blue-600/30 transition-all duration-200"
                aria-label="Open menu"
              >
                <Menu className="w-4 h-4" />
                <span>Menu</span>
              </button>
            </div>
          </div>
        </div>
      </AdminLayoutContext.Provider>
    </ProtectedRoute>
  )
}
