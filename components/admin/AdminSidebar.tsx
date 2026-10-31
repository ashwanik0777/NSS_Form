"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { hasPermission } from "@/lib/permissions"
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  ChevronLeft,
  Shield,
  Mail,
  UserCheck,
  Calendar,
  TrendingUp,
  Megaphone,
  User,
  Share2,
  Book,
  CheckCircle2,
  LockKeyhole,
  UserCog,
  UserX,
  ChevronDown,
  X,
} from "lucide-react"

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  permission?: string
  superAdminOnly?: boolean
}

interface AdminSidebarProps {
  /** Controlled by parent layout — whether the mobile drawer is open */
  mobileOpen?: boolean
  /** Called when the mobile backdrop or close button is pressed */
  onClose?: () => void
}

const groupedSidebar: {
  id: string
  group: string
  icon: React.ReactNode
  accentColor: string
  items: SidebarItem[]
}[] = [
  {
    id: "group-overview",
    group: "Overview",
    icon: <LayoutDashboard className="w-3.5 h-3.5" />,
    accentColor: "#1e40af",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
      { id: "applications", label: "Applications", href: "/admin/applications", icon: <FileText className="w-4 h-4" />, permission: "applications.view" },
    ],
  },
  {
    id: "group-people",
    group: "People & Access",
    icon: <Users className="w-3.5 h-3.5" />,
    accentColor: "#0369a1",
    items: [
      { id: "users", label: "User Management", href: "/admin/users", icon: <Users className="w-4 h-4" />, permission: "users.view" },
      { id: "whos-who", label: "Who's Who (Officers & Mentors)", href: "/admin/whos-who", icon: <Shield className="w-4 h-4" /> },
      { id: "volunteers", label: "Volunteers", href: "/admin/volunteers", icon: <UserCheck className="w-4 h-4" />, permission: "volunteers.view" },
      { id: "past-volunteers", label: "Past Volunteers", href: "/admin/past-volunteers", icon: <UserX className="w-4 h-4" />, permission: "volunteers.view" },
      { id: "manage-volunteers", label: "Manage Volunteer Data", href: "/admin/volunteers/manage", icon: <UserCog className="w-4 h-4" />, permission: "volunteers.edit" },
    ],
  },
  {
    id: "group-programs",
    group: "Programs & Events",
    icon: <Calendar className="w-3.5 h-3.5" />,
    accentColor: "#7c3aed",
    items: [
      { id: "projects", label: "Projects", href: "/admin/projects", icon: <Book className="w-4 h-4" />, permission: "events.view" },
      { id: "events", label: "Events", href: "/admin/events", icon: <Calendar className="w-4 h-4" />, permission: "events.view" },
      { id: "attendance", label: "Attendance Review", href: "/admin/attendance", icon: <CheckCircle2 className="w-4 h-4" />, permission: "events.manage" },
      { id: "manual-attendance", label: "Manual Attendance", href: "/admin/attendance/manual", icon: <UserCog className="w-4 h-4" />, permission: "events.manage" },
      { id: "meetings", label: "Meetings", href: "/admin/meetings", icon: <Calendar className="w-4 h-4" />, permission: "events.view" },
    ],
  },
  {
    id: "group-engagement",
    group: "Engagement & Support",
    icon: <Megaphone className="w-3.5 h-3.5" />,
    accentColor: "#be185d",
    items: [
      { id: "announcements", label: "Announcements", href: "/admin/announcements", icon: <Megaphone className="w-4 h-4" />, permission: "announcements.view" },
      { id: "social-posts", label: "Social Media Posts", href: "/admin/social-posts", icon: <Share2 className="w-4 h-4" />, permission: "social.view" },
      { id: "grievances", label: "Grievances", href: "/admin/grievances", icon: <FileText className="w-4 h-4" />, permission: "volunteers.view" },
      { id: "reports", label: "Reports & Issues", href: "/admin/reports", icon: <FileText className="w-4 h-4" />, permission: "volunteers.view" },
    ],
  },
  {
    id: "group-system",
    group: "System Settings",
    icon: <Settings className="w-3.5 h-3.5" />,
    accentColor: "#b45309",
    items: [
      { id: "social-links", label: "NSS Social Links", href: "/admin/social-links", icon: <TrendingUp className="w-4 h-4" />, permission: "social.view" },
      { id: "email", label: "Email System", href: "/admin/emailSystem", icon: <Mail className="w-4 h-4" />, permission: "email.view" },
      { id: "password-reset", label: "Volunteer Password Reset", href: "/admin/system/password-reset", icon: <LockKeyhole className="w-4 h-4" />, superAdminOnly: true },
    ],
  },
]

export default function AdminSidebar({ mobileOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname()
  // Desktop-only: collapsed/expanded toggle
  const [collapsed, setCollapsed] = useState(false)
  const [activeGroup, setActiveGroup] = useState<string>("group-overview")
  const { data: session } = useSession()
  const user = session?.user as any
  const userRole = user?.role
  const userPermissions = user?.permissions || []

  // Auto-expand the group whose child is currently active
  useEffect(() => {
    for (const group of groupedSidebar) {
      if (group.items.some((item) => pathname === item.href)) {
        setActiveGroup(group.id)
        break
      }
    }
  }, [pathname])

  // Close collapsed flyout when pressing Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose?.()
      }
    },
    [onClose]
  )
  useEffect(() => {
    if (mobileOpen) {
      document.addEventListener("keydown", handleKeyDown)
    }
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [mobileOpen, handleKeyDown])

  const toggleGroup = (groupId: string) => {
    setActiveGroup((prev) => (prev === groupId ? "" : groupId))
  }

  // ── Shared nav content (used in both desktop sidebar and mobile drawer) ──
  const NavContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* Logo header */}
      <div
        className={`flex items-center border-b border-slate-100 ${
          isMobile
            ? "justify-between py-4 px-4"
            : collapsed
            ? "justify-center py-5 px-3"
            : "justify-between py-5 px-5"
        }`}
      >
        {(!collapsed || isMobile) && (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0"
              style={{ boxShadow: "0 2px 8px rgba(30,64,175,0.2)" }}
            >
              <img src="/nssLogo.png" alt="NSS Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold leading-tight" style={{ color: "#0f1f3d" }}>
                NSS Admin
              </h2>
              <p className="text-[11px] font-medium" style={{ color: "#64748b" }}>
                Management Panel
              </p>
            </div>
          </div>
        )}

        {/* Desktop: collapse/expand toggle */}
        {!isMobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:bg-slate-100 active:scale-95 flex-shrink-0"
            style={{ color: "#64748b" }}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
          </button>
        )}

        {/* Mobile: close drawer button */}
        {isMobile && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 hover:bg-slate-100 active:scale-95"
            style={{ color: "#64748b" }}
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 scroll-smooth overscroll-contain">
        {groupedSidebar.map(({ id, group, icon, accentColor, items }) => {
          const isExpanded = activeGroup === id

          return (
            <div key={id} className="relative">
              {/* Group label button */}
              <button
                type="button"
                onClick={() => toggleGroup(id)}
                title={collapsed && !isMobile ? group : undefined}
                className={`w-full flex items-center ${
                  collapsed && !isMobile ? "justify-center px-2 py-2.5" : "justify-between px-3 py-2"
                } rounded-lg transition-all duration-150 hover:bg-slate-50 active:scale-[0.99]`}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
                    style={{ background: `${accentColor}18`, color: accentColor }}
                  >
                    {icon}
                  </span>
                  {(!collapsed || isMobile) && (
                    <span
                      className="text-[11px] font-semibold uppercase tracking-[0.06em]"
                      style={{ color: "#94a3b8" }}
                    >
                      {group}
                    </span>
                  )}
                </span>
                {(!collapsed || isMobile) && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                    style={{ color: "#cbd5e1" }}
                  />
                )}
              </button>

              {/* Items — expanded list (mobile always shows list; desktop shows when not collapsed) */}
              {isExpanded && (!collapsed || isMobile) && (
                <ul className="mt-0.5 space-y-0.5 pl-2">
                  {items.map((item) => {
                    if (item.superAdminOnly && userRole !== "admin") return null
                    if (
                      userRole !== "admin" &&
                      item.permission &&
                      !hasPermission(userPermissions, item.permission as any)
                    )
                      return null

                    const isActive = pathname === item.href

                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          onClick={isMobile ? onClose : undefined}
                          className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
                            isActive
                              ? "sidebar-active-link text-white"
                              : "text-slate-600 hover:bg-blue-50/70 hover:text-blue-700"
                          }`}
                        >
                          <span
                            className={`flex-shrink-0 transition-colors duration-150 ${
                              isActive
                                ? "text-white"
                                : "text-slate-400 group-hover:text-blue-600"
                            }`}
                          >
                            {item.icon}
                          </span>
                          <span className="truncate">{item.label}</span>
                          {isActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70 flex-shrink-0" />
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}

              {/* Desktop-only: collapsed flyout */}
              {isExpanded && collapsed && !isMobile && (
                <div
                  className="absolute left-full top-0 ml-2 z-50 bg-white border border-slate-200 rounded-xl min-w-[220px] p-2 smooth-popover"
                  style={{ boxShadow: "0 8px 32px rgba(15,31,61,0.14)" }}
                >
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wider px-3 py-1.5"
                    style={{ color: "#94a3b8" }}
                  >
                    {group}
                  </p>
                  <ul className="space-y-0.5">
                    {items.map((item) => {
                      if (item.superAdminOnly && userRole !== "admin") return null
                      if (
                        userRole !== "admin" &&
                        item.permission &&
                        !hasPermission(userPermissions, item.permission as any)
                      )
                        return null
                      const isActive = pathname === item.href
                      return (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.98] ${
                              isActive
                                ? "sidebar-active-link text-white"
                                : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                            }`}
                          >
                            <span
                              className={`flex-shrink-0 ${isActive ? "text-white" : "text-slate-400"}`}
                            >
                              {item.icon}
                            </span>
                            {item.label}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* User card */}
      <div className="p-3 border-t border-slate-100">
        <Link
          href="/admin/profile"
          onClick={isMobile ? onClose : undefined}
          className="flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 hover:bg-blue-50/60 active:scale-[0.98] group"
          title={collapsed && !isMobile ? user?.name || "Admin User" : undefined}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
              boxShadow: "0 2px 8px rgba(30,64,175,0.3)",
            }}
          >
            <Shield className="w-4 h-4 text-white" />
          </div>
          {(!collapsed || isMobile) && (
            <>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold truncate transition-colors duration-150 group-hover:text-blue-700"
                  style={{ color: "#0f1f3d" }}
                >
                  {user?.name || "Admin User"}
                </p>
                <p className="text-[11px] truncate" style={{ color: "#94a3b8" }}>
                  {userRole === "admin" ? "Super Administrator" : "Sub Administrator"}
                </p>
              </div>
              <User
                className="w-3.5 h-3.5 flex-shrink-0 transition-colors duration-150 group-hover:text-blue-600"
                style={{ color: "#cbd5e1" }}
              />
            </>
          )}
          {collapsed && !isMobile && (
            <User className="w-3.5 h-3.5" style={{ color: "#cbd5e1" }} />
          )}
        </Link>
      </div>
    </>
  )

  return (
    <>
      {/* ════════════════════════════════════
          DESKTOP SIDEBAR (md and above)
          ════════════════════════════════════ */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 bg-white border-r border-slate-200/80 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] h-screen ${
          collapsed ? "w-[72px]" : "w-[272px]"
        }`}
        style={{ boxShadow: "2px 0 16px rgba(15,31,61,0.06)" }}
      >
        <NavContent isMobile={false} />
      </aside>

      {/* ════════════════════════════════════
          MOBILE DRAWER (below md)
          ════════════════════════════════════ */}

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(15,31,61,0.45)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[288px] flex flex-col bg-white md:hidden transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ boxShadow: "4px 0 32px rgba(15,31,61,0.15)" }}
        aria-label="Mobile navigation"
      >
        <NavContent isMobile={true} />
      </aside>
    </>
  )
}
