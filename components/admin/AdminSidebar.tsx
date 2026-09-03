"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { hasPermission } from "@/lib/permissions"
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Settings,
  ChevronLeft,
  Shield,
  Mail,
  UserCheck,
  Calendar,
  Award,
  FolderKanban,
  TrendingUp,
  Megaphone,
  User,
  Share2,
  LucideProjector,
  Book,
  CheckCircle2,
  LockKeyhole,
  UserCog,
  UserX,
} from "lucide-react"

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  permission?: string
  superAdminOnly?: boolean
}

const groupedSidebar: { id: string; group: string; icon: React.ReactNode; colorClass: string; items: SidebarItem[] }[] = [
  {
    id: "group-overview",
    group: "Overview",
    icon: <LayoutDashboard className="w-4 h-4" />,
    colorClass: "text-purple-600",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
      { id: "applications", label: "Applications", href: "/admin/applications", icon: <FileText className="w-5 h-5" />, permission: "applications.view" },
    ],
  },
  {
    id: "group-people",
    group: "People & Access",
    icon: <Users className="w-4 h-4" />,
    colorClass: "text-sky-600",
    items: [
      { id: "users", label: "User Management", href: "/admin/users", icon: <Users className="w-5 h-5" />, permission: "users.view" },
      { id: "volunteers", label: "Volunteers", href: "/admin/volunteers", icon: <UserCheck className="w-5 h-5" />, permission: "volunteers.view" },
      { id: "past-volunteers", label: "Past Volunteers", href: "/admin/past-volunteers", icon: <UserX className="w-5 h-5" />, permission: "volunteers.view" },
      { id: "manage-volunteers", label: "Manage Volunteer Data", href: "/admin/volunteers/manage", icon: <UserCog className="w-5 h-5" />, permission: "volunteers.edit" },
    ],
  },
  {
    id: "group-programs",
    group: "Programs & Events",
    icon: <Calendar className="w-4 h-4" />,
    colorClass: "text-pink-600",
    items: [
      { id: "projects", label: "Projects", href: "/admin/projects", icon: <Book className="w-5 h-5" />, permission: "events.view" },
      { id: "events", label: "Events", href: "/admin/events", icon: <Calendar className="w-5 h-5" />, permission: "events.view" },
      {
        id: "attendance",
        label: "Attendance Review",
        href: "/admin/attendance",
        icon: <CheckCircle2 className="w-5 h-5" />,
        permission: "events.manage",
      },
      {
        id: "manual-attendance",
        label: "Manual Attendance",
        href: "/admin/attendance/manual",
        icon: <UserCog className="w-5 h-5" />,
        permission: "events.manage",
      },
      { id: "meetings", label: "Meetings", href: "/admin/meetings", icon: <Calendar className="w-5 h-5" />, permission: "events.view" },
    ],
  },
  {
    id: "group-engagement",
    group: "Engagement & Support",
    icon: <Megaphone className="w-4 h-4" />,
    colorClass: "text-rose-600",
    items: [
      { id: "announcements", label: "Announcements", href: "/admin/announcements", icon: <Megaphone className="w-5 h-5" />, permission: "announcements.view" },
      { id: "social-posts", label: "Social Media Posts", href: "/admin/social-posts", icon: <Share2 className="w-5 h-5" />, permission: "social.view" },
      { id: "grievances", label: "Grievances", href: "/admin/grievances", icon: <FileText className="w-5 h-5" />, permission: "volunteers.view" },
      { id: "reports", label: "Reports & Issues", href: "/admin/reports", icon: <FileText className="w-5 h-5" />, permission: "volunteers.view" },
    ],
  },
  {
    id: "group-system",
    group: "System Settings",
    icon: <Settings className="w-4 h-4" />,
    colorClass: "text-amber-600",
    items: [
      { id: "social-links", label: "NSS Social Links", href: "/admin/social-links", icon: <TrendingUp className="w-5 h-5" />, permission: "social.view" },
      { id: "email", label: "Email System", href: "/admin/emailSystem", icon: <Mail className="w-5 h-5" />, permission: "email.view" },
      { id: "password-reset", label: "Volunteer Password Reset", href: "/admin/system/password-reset", icon: <LockKeyhole className="w-5 h-5" />, superAdminOnly: true },
    ],
  },
]

// Color mapping for individual items (for colorful icons)
const getItemColorClass = (id: string): string => {
  switch (id) {
    case "dashboard":
      return "text-purple-600"
    case "applications":
      return "text-indigo-600"
    case "users":
      return "text-sky-600"
    case "volunteers":
      return "text-blue-600"
    case "manage-volunteers":
      return "text-blue-700"
    case "projects":
      return "text-emerald-600"
    case "events":
      return "text-pink-600"
    case "attendance":
      return "text-green-600"
    case "meetings":
      return "text-orange-600"
    case "announcements":
      return "text-rose-600"
    case "social-posts":
      return "text-cyan-600"
    case "grievances":
      return "text-fuchsia-600"
    case "social-links":
      return "text-teal-600"
    case "email":
      return "text-amber-600"
    case "password-reset":
      return "text-red-600"
    default:
      return "text-primary"
  }
}

export default function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [activeGroup, setActiveGroup] = useState<string>("group-overview")
  const { data: session } = useSession()
  const user = session?.user as any
  const userRole = user?.role
  const userPermissions = user?.permissions || []

  const toggleGroup = (groupId: string) => {
    setActiveGroup((prev) => (prev === groupId ? "" : groupId))
  }

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-72"
      } bg-white border-r border-border/50 transition-all duration-300 ease-in-out shadow-xl h-screen flex flex-col`}
    >
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        {!collapsed && (
          <div className="flex items-center">
            <div className="rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <img src="/nssLogo.png" alt="NSS Logo" className="w-13 h-13 rounded-full border-2 border-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">NSS Admin</h2>
              <p className="text-sm text-muted-foreground">Management Panel</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-muted rounded-xl transition-all duration-300 hover:scale-110 active:scale-95"
        >
          <ChevronLeft className={`w-5 h-5 transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {groupedSidebar.map(({ id, group, icon, colorClass, items }) => {
            const isExpanded = activeGroup === id
            return (
              <div key={id} className="relative">
                <button
                  type="button"
                  onClick={() => toggleGroup(id)}
                  className={`w-full flex items-center ${collapsed ? "justify-center" : "justify-between"} px-3 py-2 rounded-lg hover:bg-muted/80 transition-colors`}
                  title={collapsed ? group : undefined}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-md bg-muted/60 ${colorClass}`}>{icon}</span>
                    {!collapsed && <span className="text-xs uppercase tracking-wide text-muted-foreground">{group}</span>}
                  </span>
                  {!collapsed && (
                    <span
                      className={`w-3 h-3 border-t-2 border-r-2 border-muted-foreground/70 inline-block transition-transform ${
                        isExpanded ? "rotate-135" : "rotate-45"
                      }`}
                    />
                  )}
                </button>

                {isExpanded && !collapsed && (
                  <ul className="mt-2 space-y-2 pl-2">
                    {items.map((item) => {
                      if (item.superAdminOnly && userRole !== "admin") {
                        return null
                      }
                      if (userRole !== "admin" && item.permission && !hasPermission(userPermissions, item.permission as any)) {
                        return null
                      }
                      const isActive = pathname === item.href
                      const color = getItemColorClass(item.id)
                      return (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-300 ${
                              isActive
                                ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25"
                                : "text-foreground hover:bg-muted/80 hover:scale-105"
                            }`}
                            title={collapsed ? item.label : undefined}
                          >
                            <span className={`flex-shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"} ${!isActive ? color : ""}`}>
                              {item.icon}
                            </span>
                            {!collapsed && <span className="ml-4 text-sm font-semibold transition-all duration-300">{item.label}</span>}
                            {!collapsed && isActive && <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}

                {isExpanded && collapsed && (
                  <div className="absolute left-full top-0 ml-2 z-50 bg-card border border-border rounded-xl shadow-xl min-w-[220px] p-2">
                    <ul className="space-y-1">
                      {items.map((item) => {
                        if (item.superAdminOnly && userRole !== "admin") {
                          return null
                        }
                        if (userRole !== "admin" && item.permission && !hasPermission(userPermissions, item.permission as any)) {
                          return null
                        }
                        const isActive = pathname === item.href
                        const color = getItemColorClass(item.id)
                        return (
                          <li key={item.id}>
                            <Link
                              href={item.href}
                              className={`group flex items-center px-3 py-2 rounded-lg transition-all duration-300 ${
                                isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted/80 text-foreground"
                              }`}
                              title={item.label}
                            >
                              <span className={`mr-2 ${!isActive ? color : ""}`}>{item.icon}</span>
                              <span className="text-sm font-medium">{item.label}</span>
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
        </div>
      </nav>

      <div className="p-4 border-t border-border/50">
        <Link
          href="/admin/profile"
          className="block bg-muted/50 backdrop-blur-sm rounded-xl p-4 border border-border/30 hover:bg-muted/70 transition-colors group"
        >
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
              <Shield className="w-4 h-4 text-white" />
            </div>
            {!collapsed && (
              <>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    {user?.name || "Admin User"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {userRole === "admin" ? "Super Administrator" : "Sub Administrator"}
                  </p>
                </div>
                <User className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </>
            )}
            {collapsed && <User className="w-4 h-4 text-muted-foreground" />}
          </div>
        </Link>
      </div>
    </aside>
  )
}
