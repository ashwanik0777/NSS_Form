"use client"

import type React from "react"
import { useState } from "react"
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
} from "lucide-react"


interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  href: string
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

export default function VolunteerSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: session } = useSession()
  const user = session?.user as any

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
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded-lg shadow-lg hover:bg-muted transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`${collapsed ? "w-20" : "w-72"
          } ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } bg-gradient-to-b from-card to-card/80 backdrop-blur-md border-r border-border/50 transition-all duration-300 ease-in-out shadow-xl h-screen flex flex-col fixed lg:relative z-50`}
      >
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          {!collapsed && (
            <div className="flex items-center">
              <div className="rounded-xl flex items-center justify-center mr-3 shadow-lg">
                {/* <Award className="w-6 h-6 text-white" /> */}
                {/* nss logo */}
                <img
                  src="/nssLogo.png"
                  alt="NSS Logo"
                  className="w-12 h-12 object-contain"
                />

              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">NSS Volunteer</h2>
                <p className="text-sm text-muted-foreground">Portal</p>
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

        <nav className="p-4 flex-1">
          <ul className="space-y-2">
            {items.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href))
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`group flex items-center px-4 py-3 rounded-xl transition-all duration-300 ${isActive
                        ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25"
                        : "text-foreground hover:bg-muted/80 hover:scale-105"
                      }`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span
                      className={`flex-shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"
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
          <div className="p-4 border-t border-border/50">
            <div className="bg-muted/50 backdrop-blur-sm rounded-xl p-4 border border-border/30 mb-3 flex items-center justify-center">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mr-3 shadow-md">
                  {/* user photo */}
                  {user?.image ? (
                    <img
                      src={user.photo}
                      alt={user.name || "Profile Photo"}
                      className="w-10 h-10 rounded-xl object-cover"
                    />
                  ) : (
                    <Award className="w-5 h-5 text-white" />
                  )}
                  
                  {/* user name */}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{user?.name || "Volunteer"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 ml-2 mt-2" />
              </button>
            </div>

          </div>
        )}
      </aside>
    </>
  )
}

