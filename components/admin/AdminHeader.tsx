"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Bell, User, ChevronDown, Settings, LogOut } from "lucide-react"

interface AdminHeaderProps {
  title: string
  subtitle?: string
}

export default function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const notifications = [
    { id: 1, message: "New application submitted by John Doe", time: "2 minutes ago", unread: true },
    { id: 2, message: "Application approved for Jane Smith", time: "1 hour ago", unread: true },
    { id: 3, message: "System maintenance scheduled", time: "3 hours ago", unread: false },
  ]

  const unreadCount = notifications.filter((n) => n.unread).length

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 hover:bg-muted rounded-lg transition-colors relative"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-popover border border-border rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-border hover:bg-muted/50 ${notification.unread ? "bg-blue-50/50" : ""}`}
                    >
                      <p className="text-sm text-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-border">
                  <button className="text-sm text-primary hover:text-primary/80 w-full text-center">
                    Mark all as read
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-medium text-foreground">Admin User</span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg z-50">
                <div className="py-1">
                  <button className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </button>
                  <button className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </button>
                  <hr className="my-1 border-border" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
