"use client"

import { useState, useEffect, useRef } from "react"
import { signOut, useSession } from "next-auth/react"
import { Bell, User, ChevronDown, Settings, LogOut, Loader2, Check, Menu } from "lucide-react"
import Link from "next/link"
import { useAdminLayout } from "@/components/admin/AdminLayoutContext"

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
  const { openMobileSidebar } = useAdminLayout()
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
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

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
      return () => document.removeEventListener("mousedown", handleClickOutside)
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
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return time.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
  }

  const markAsRead = async (notificationId: string) => {
    const updatedNotifications = notifications.map((n) =>
      n.id === notificationId ? { ...n, unread: false } : n
    )
    setNotifications(updatedNotifications)
    setUnreadCount((prev) => Math.max(0, prev - 1))

    try {
      await fetch("/api/admin/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
      setNotifications(notifications)
      setUnreadCount((prev) => prev + 1)
    }
  }

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => n.unread)
    if (unreadNotifications.length === 0) return

    const updatedNotifications = notifications.map((n) => ({ ...n, unread: false }))
    setNotifications(updatedNotifications)
    const previousUnreadCount = unreadCount
    setUnreadCount(0)

    try {
      await fetch("/api/admin/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: unreadNotifications.map((n) => n.id) }),
      })
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      setNotifications(notifications)
      setUnreadCount(previousUnreadCount)
    }
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  const userPhoto = (session?.user as any)?.image || (session?.user as any)?.photo

  return (
    <header
      className="bg-white px-3 sm:px-6 py-3.5 sticky top-0 z-40"
      style={{
        borderBottom: "1px solid #e8edf5",
        boxShadow: "0 1px 4px rgba(15,31,61,0.05)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        {/* ── Left: Hamburger (mobile) + Title ── */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Hamburger — visible only on mobile (below md), reads openMobileSidebar from context */}
          <button
            id="admin-mobile-menu-btn"
            onClick={openMobileSidebar}
            className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150 hover:bg-slate-100 active:scale-95"
            style={{ color: "#0f1f3d" }}
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title — always visible */}
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold leading-tight truncate" style={{ color: "#0f1f3d" }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] sm:text-sm mt-0.5 truncate" style={{ color: "#64748b" }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* ── Right Controls ── */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              id="admin-notifications-btn"
              onClick={() => {
                setShowNotifications(!showNotifications)
                setShowUserMenu(false)
              }}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 hover:bg-slate-100 active:scale-95"
              style={{ color: "#64748b" }}
              aria-label="Toggle notifications"
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                  style={{ background: "#dc2626" }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className="absolute right-0 mt-2 bg-white rounded-2xl overflow-hidden z-50"
                style={{
                  width: "min(340px, calc(100vw - 1.5rem))",
                  border: "1px solid #e8edf5",
                  boxShadow: "0 8px 32px rgba(15,31,61,0.12), 0 2px 8px rgba(15,31,61,0.06)",
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: "1px solid #f0f4f8" }}>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold" style={{ color: "#0f1f3d" }}>Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: "#1e40af" }}>
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {loadingNotifications && <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#94a3b8" }} />}
                    {notifications.some(n => n.unread) && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] font-medium px-2 py-1 rounded-lg transition-colors hover:bg-blue-50"
                        style={{ color: "#1e40af" }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>

                {/* List */}
                <div className="overflow-y-auto" style={{ maxHeight: "min(320px, 55vh)" }}>
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 px-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "#f0f4f8" }}>
                        <Bell className="w-5 h-5" style={{ color: "#94a3b8" }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: "#64748b" }}>All caught up!</p>
                      <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>No new notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => notification.unread && markAsRead(notification.id)}
                        className="flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors duration-150"
                        style={{
                          background: notification.unread ? "#f0f6ff" : "transparent",
                          borderBottom: "1px solid #f0f4f8",
                        }}
                        onMouseEnter={(e) => { if (!notification.unread) (e.currentTarget as HTMLElement).style.background = "#f8fafc" }}
                        onMouseLeave={(e) => { if (!notification.unread) (e.currentTarget as HTMLElement).style.background = "transparent" }}
                      >
                        <div
                          className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                          style={{ background: notification.unread ? "#1e40af" : "#e8edf5" }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm leading-snug" style={{ color: "#1e293b" }}>{notification.message}</p>
                          <p className="text-[11px] mt-1" style={{ color: "#94a3b8" }}>{formatTime(notification.time)}</p>
                        </div>
                        {notification.unread && (
                          <Check className="w-3.5 h-3.5 flex-shrink-0 mt-1" style={{ color: "#94a3b8" }} />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              id="admin-user-menu-btn"
              onClick={() => {
                setShowUserMenu(!showUserMenu)
                setShowNotifications(false)
              }}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl transition-all duration-150 hover:bg-slate-100 active:scale-95"
            >
              {userPhoto ? (
                <img
                  src={userPhoto}
                  alt={session?.user?.name || "Profile"}
                  className="w-8 h-8 rounded-lg object-cover"
                  style={{ boxShadow: "0 0 0 2px #dbeafe" }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #1e40af, #3b82f6)" }}
                >
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="text-sm font-semibold max-w-[120px] truncate hidden sm:block" style={{ color: "#0f1f3d" }}>
                {session?.user?.name || session?.user?.email || "Admin"}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 hidden sm:block ${showUserMenu ? "rotate-180" : ""}`}
                style={{ color: "#94a3b8" }}
              />
            </button>

            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 bg-white rounded-2xl overflow-hidden z-50"
                style={{
                  width: "min(220px, calc(100vw - 1.5rem))",
                  border: "1px solid #e8edf5",
                  boxShadow: "0 8px 32px rgba(15,31,61,0.12), 0 2px 8px rgba(15,31,61,0.06)",
                }}
              >
                {/* User info */}
                <div className="px-4 py-3.5" style={{ borderBottom: "1px solid #f0f4f8" }}>
                  <p className="text-sm font-semibold truncate" style={{ color: "#0f1f3d" }}>
                    {session?.user?.name || "Admin User"}
                  </p>
                  <p className="text-[11px] truncate mt-0.5" style={{ color: "#94a3b8" }}>
                    {session?.user?.email || ""}
                  </p>
                </div>

                <div className="p-1.5">
                  <Link href="/admin/profile">
                    <button className="flex items-center w-full gap-2.5 px-3 py-2.5 text-sm rounded-xl transition-colors hover:bg-slate-50" style={{ color: "#334155" }}>
                      <User className="w-4 h-4 flex-shrink-0" style={{ color: "#64748b" }} />
                      Profile
                    </button>
                  </Link>
                  <button className="flex items-center w-full gap-2.5 px-3 py-2.5 text-sm rounded-xl transition-colors hover:bg-slate-50" style={{ color: "#334155" }}>
                    <Settings className="w-4 h-4 flex-shrink-0" style={{ color: "#64748b" }} />
                    Settings
                  </button>
                </div>

                <div className="p-1.5" style={{ borderTop: "1px solid #f0f4f8" }}>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full gap-2.5 px-3 py-2.5 text-sm rounded-xl transition-colors hover:bg-red-50"
                    style={{ color: "#dc2626" }}
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    Sign out
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
