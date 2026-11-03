"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  LayoutDashboard,
  User,
  FolderKanban,
  FileText,
  Settings,
  ChevronLeft,
  Award,
  LogOut,
  Menu,
  Calendar,
  CreditCard,
  Shield,
  X,
} from "lucide-react"

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
}

interface VolunteerSidebarProps {
  /** Controlled by parent layout on mobile */
  mobileOpen?: boolean
  /** Called when mobile overlay or close button is clicked */
  onClose?: () => void
}

const sidebarItems: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/dashboard",
    icon: <LayoutDashboard className="w-5 h-5 text-sky-500" />,
  },
  {
    id: "profile",
    label: "Complete Profile",
    href: "/dashboard/profile",
    icon: <User className="w-5 h-5 text-emerald-500" />,
  },
  {
    id: "projects",
    label: "NSS Projects",
    href: "/dashboard/projects",
    icon: <FolderKanban className="w-5 h-5 text-purple-500" />,
  },
  {
    id: "application",
    label: "My Application",
    href: "/dashboard/application",
    icon: <FileText className="w-5 h-5 text-indigo-500" />,
  },
  {
    id: "id-card",
    label: "ID Card",
    href: "/dashboard/id-card",
    icon: <CreditCard className="w-5 h-5 text-amber-500" />,
  },
  {
    id: "events",
    label: "Events",
    href: "/dashboard/events",
    icon: <Calendar className="w-5 h-5 text-rose-500" />,
  },
  {
    id: "meetings",
    label: "Meetings",
    href: "/dashboard/meetings",
    icon: <Calendar className="w-5 h-5 text-blue-500" />,
  },
  {
    id: "grievances",
    label: "Grievances",
    href: "/dashboard/grievances",
    icon: <FileText className="w-5 h-5 text-orange-500" />,
  },
  {
    id: "reports",
    label: "Reports & Issues",
    href: "/dashboard/reports",
    icon: <FileText className="w-5 h-5 text-fuchsia-500" />,
  },
  {
    id: "tasks",
    label: "Tasks",
    href: "/dashboard/tasks",
    icon: <FileText className="w-5 h-5 text-teal-500" />,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/dashboard/settings",
    icon: <Settings className="w-5 h-5 text-slate-500" />,
  },
]

export default function VolunteerSidebar({ mobileOpen: controlledMobileOpen, onClose }: VolunteerSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [uncontrolledMobileOpen, setUncontrolledMobileOpen] = useState(false)
  const { data: session } = useSession()
  const user = session?.user as any

  const isMobileOpen = controlledMobileOpen !== undefined ? controlledMobileOpen : uncontrolledMobileOpen
  const effectiveOnClose = onClose || (() => setUncontrolledMobileOpen(false))

  // Close mobile drawer on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        effectiveOnClose()
      }
    },
    [effectiveOnClose]
  )

  useEffect(() => {
    if (isMobileOpen) {
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isMobileOpen, handleKeyDown])

  const items = [...sidebarItems]

  if (user?.role === "admin" || user?.role === "sub-admin") {
    let label = "Admin Access"
    if (user?.hierarchy === "convener") label = "Convener Access"
    else if (user?.hierarchy === "co-convener") label = "Co-Convener Access"
    else if (user?.role === "sub-admin") label = "Sub-Admin Access"

    items.push({
      id: "admin-access",
      label: label,
      href: "/admin",
      icon: <Shield className="w-5 h-5 text-red-500" />,
    })
  }

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" })
  }

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={`lg:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 transition-opacity duration-300 ${
          isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={effectiveOnClose}
        aria-hidden="true"
      />

      <aside
        className={`${collapsed ? "w-20" : "w-72"} ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } bg-gradient-to-b from-card to-card/95 backdrop-blur-md border-r border-border/50 transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none h-screen flex flex-col fixed lg:relative z-50`}
        aria-label="Volunteer navigation"
      >
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border/50">
          <div className="flex items-center">
            <div className="rounded-xl flex items-center justify-center mr-3 shadow-md">
              <img
                src="/nssLogo.png"
                alt="NSS Logo"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
              />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-foreground leading-tight">NSS Volunteer</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Portal</p>
            </div>
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-2 hover:bg-muted rounded-xl transition-all duration-300 hover:scale-110 active:scale-95"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
          </button>

          {/* Mobile close drawer button */}
          <button
            onClick={effectiveOnClose}
            className="lg:hidden p-2 hover:bg-muted rounded-xl transition-all duration-150 active:scale-95"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <nav className="p-3 sm:p-4 flex-1 overflow-y-auto scroll-smooth overscroll-contain">
          <ul className="space-y-1.5 sm:space-y-2">
            {items.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href))
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={effectiveOnClose}
                    className={`group flex items-center px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/25"
                        : "text-foreground hover:bg-muted/80 hover:translate-x-1"
                    }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span
                      className={`flex-shrink-0 transition-transform duration-200 ${
                        isActive ? "scale-110" : "group-hover:scale-110"
                      }`}
                    >
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span className="ml-3 sm:ml-4 text-xs sm:text-sm font-semibold transition-all duration-200">
                        {item.label}
                      </span>
                    )}
                    {!collapsed && isActive && (
                      <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {!collapsed && (
          <div className="p-3 sm:p-4 border-t border-border/50">
            <div className="bg-muted/50 backdrop-blur-sm rounded-xl p-3 border border-border/30 flex items-center justify-between gap-2">
              <div className="flex items-center min-w-0">
                <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center mr-2.5 shadow-xs shrink-0 overflow-hidden">
                  {user?.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "Profile Photo"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Award className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{user?.name || "Volunteer"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="p-2 hover:bg-red-50 text-muted-foreground hover:text-red-600 rounded-lg transition-colors shrink-0"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
