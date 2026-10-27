"use client"

import { useState, useEffect, useRef } from "react"
import { signOut, useSession } from "next-auth/react"
import { Bell, User, ChevronDown, Settings, LogOut, Loader2 } from "lucide-react"
import Link from "next/link"

interface AdminHeaderProps {
  title: string
  subtitle?: string
}

interface Notification {
  id: string
  type: string
  message: string
  time: string
  unread: boolean
  data?: any
}

export default function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const { data: session } = useSession()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const notificationRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true)
      const res = await fetch("/api/admin/notifications")
      const data = await res.json()
      if (data.success) {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error("Error fetching notifications:", error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchNotifications()
      // Refresh notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showNotifications || showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [showNotifications, showUserMenu])

  const formatTime = (timeString: string) => {
    const time = new Date(timeString)
    const now = new Date()
    const diff = now.getTime() - time.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`
    return time.toLocaleDateString()
  }

  const markAsRead = async (notificationId: string) => {
    // Optimistically update UI
    const updatedNotifications = notifications.map((n) =>
      n.id === notificationId ? { ...n, unread: false } : n
    )
    setNotifications(updatedNotifications)
    setUnreadCount((prev) => Math.max(0, prev - 1))

    // Save to database
    try {
      await fetch("/api/admin/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
      // Revert on error
      setNotifications(notifications)
      setUnreadCount((prev) => prev + 1)
    }
  }

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => n.unread)
    if (unreadNotifications.length === 0) return

    // Optimistically update UI
    const updatedNotifications = notifications.map((n) => ({ ...n, unread: false }))
    setNotifications(updatedNotifications)
    const previousUnreadCount = unreadCount
    setUnreadCount(0)

    // Save to database
    try {
      await fetch("/api/admin/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notificationIds: unreadNotifications.map((n) => n.id),
        }),
      })
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      // Revert on error
      setNotifications(notifications)
      setUnreadCount(previousUnreadCount)
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <header className="bg-background border-b border-border px-4 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative" ref={notificationRef}>
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
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  {loadingNotifications && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => {
                          if (notification.unread) {
                            markAsRead(notification.id)
                          }
                        }}
                        className={`p-4 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors ${
                          notification.unread ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                        }`}
                      >
                        <p className="text-sm text-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatTime(notification.time)}</p>
                      </div>
                    ))
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-border">
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-primary hover:text-primary/80 w-full text-center"
                    >
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 hover:bg-muted rounded-lg transition-colors"
            >
                {session?.user?.image || (session?.user as any)?.photo ? (
                  <img
                    src={(session?.user as any)?.image || (session?.user as any)?.photo}
                    alt={session?.user?.name || "Profile Photo"}
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement
                      target.style.display = "none"
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
                <span className="text-sm font-medium text-foreground">
                {session?.user?.name || session?.user?.email || "Admin User"}
                </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg z-50">
                <div className="py-1">
                  <Link href="/admin/profile"><button className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </button></Link>
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
