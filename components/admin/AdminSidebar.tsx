"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
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
} from "lucide-react"

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
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
  },
  {
    id: "users",
    label: "User Management",
    href: "/admin/users",
    icon: <Users className="w-5 h-5" />,
  },
  {
    id: "projects",
    label: "Project Management",
    href: "/admin/projects",
    icon: <FolderKanban className="w-5 h-5" />,
  },
  {
    id: "volunteer-management",
    label: "Volunteer Management",
    href: "/admin/volunteer-management",
    icon: <UserCheck className="w-5 h-5" />,
  },
  {
    id: "events",
    label: "Events",
    href: "/admin/events",
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    id: "announcements",
    label: "Announcements",
    href: "/admin/announcements",
    icon: <Megaphone className="w-5 h-5" />,
  },
  // {
  //   id: "certificates",
  //   label: "Certificates",
  //   href: "/admin/certificates",
  //   icon: <Award className="w-5 h-5" />,
  // },
  // {
  //   id: "reports",
  //   label: "Reports",
  //   href: "/admin/reports",
  //   icon: <BarChart3 className="w-5 h-5" />,
  // },
  {
    id: "email",
    label: "Email System",
    href: "/admin/emailSystem",
    icon: <Mail className="w-5 h-5" />,
  },
  // {
  //   id: "settings",
  //   label: "Settings",
  //   href: "/admin/settings",
  //   icon: <Settings className="w-5 h-5" />,
  // },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

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
          <div className="bg-muted/50 backdrop-blur-sm rounded-xl p-4 border border-border/30">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center mr-3">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Admin User</p>
                <p className="text-xs text-muted-foreground">Super Administrator</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
