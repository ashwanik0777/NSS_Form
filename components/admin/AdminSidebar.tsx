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
} from "lucide-react"

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  permission?: string
  children?: SidebarItem[]
}

const sidebarItems: SidebarItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    href: "/admin",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    id: "applications",
    label: "Applications",
    href: "/admin/applications",
    icon: <FileText className="w-5 h-5" />,
    permission: "applications.view",
  },
  {
    id: "users",
    label: "User Management",
    href: "/admin/users",
    icon: <Users className="w-5 h-5" />,
    permission: "users.view",
  },
  {
    id: "projects",
    label: "Project Management",
    href: "/admin/projects",
    icon: <FolderKanban className="w-5 h-5" />,
    permission: "projects.view",
  },
  {
    id: "volunteer-management",
    label: "Volunteer Management",
    href: "/admin/volunteer-management",
    icon: <UserCheck className="w-5 h-5" />,
    permission: "volunteers.view",
  },
  {
    id: "events",
    label: "Events",
    href: "/admin/events",
    icon: <Calendar className="w-5 h-5" />,
    permission: "events.view",
  },
  {
    id: "grievances",
    label: "Grievances",
    href: "/admin/grievances",
    icon: <FileText className="w-5 h-5" />,
    permission: "volunteers.view",
  },
  {
    id: "meetings",
    label: "Meetings",
    href: "/admin/meetings",
    icon: <Calendar className="w-5 h-5" />,
    permission: "events.view",
  },
  {
    id: "announcements",
    label: "Announcements",
    href: "/admin/announcements",
    icon: <Megaphone className="w-5 h-5" />,
    permission: "announcements.view",
  },
  {
    id: "social-links",
    label: "NSS Social Links",
    href: "/admin/social-links",
    icon: <TrendingUp className="w-5 h-5" />,
    permission: "social.view",
  },
  {
    id: "email",
    label: "Email System",
    href: "/admin/emailSystem",
    icon: <Mail className="w-5 h-5" />,
    permission: "email.view",
  },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { data: session } = useSession()
  const user = session?.user as any
  const userRole = user?.role
  const userPermissions = user?.permissions || []

  return (
    <aside
      className={`${
        collapsed ? "w-20" : "w-72"
      } bg-gradient-to-b from-card to-card/80 backdrop-blur-md border-r border-border/50 transition-all duration-300 ease-in-out shadow-xl`}
    >
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        {!collapsed && (
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <Shield className="w-6 h-6 text-white" />
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

      <nav className="p-4">
        <ul className="space-y-2">
          {sidebarItems.map((item) => {
            // Admin users have access to everything, skip permission check for them
            if (userRole !== "admin" && item.permission && !hasPermission(userPermissions, item.permission as any)) {
              return null
            }
            
            const isActive = pathname === item.href
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
                  <span
                    className={`flex-shrink-0 transition-transform duration-300 ${
                      isActive ? "scale-110" : "group-hover:scale-110"
                    }`}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="ml-4 text-sm font-semibold transition-all duration-300">{item.label}</span>
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
        <div className="absolute bottom-4 left-4 right-4">
          <Link
            href="/admin/profile"
            className="block bg-muted/50 backdrop-blur-sm rounded-xl p-4 border border-border/30 hover:bg-muted/70 transition-colors group"
          >
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                  {user?.name || "Admin User"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userRole === "admin" ? "Super Administrator" : "Sub Administrator"}
                </p>
              </div>
              <User className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        </div>
      )}
    </aside>
  )
}
