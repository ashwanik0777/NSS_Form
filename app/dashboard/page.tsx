"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import React from "react"
import {
  Loader2,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Award,
  FolderKanban,
  User,
  TrendingUp,
  Calendar,
  MapPin,
  ArrowRight,
  Clock,
  Bell,
  Megaphone,
  X,
  Users,
  Share2,
  Eye,
  Star,
  ExternalLink,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
} from "lucide-react"

interface ApplicationData {
  _id: string
  nameEnglish: string
  institutionName: string
  formNo: string
  status: string
  submittedAt: string
  reviewedAt?: string
}

interface ProfileCompletion {
  percent: number
  missing: string[]
}

interface SelectedProject {
  _id: string
  title: string
  description: string
  location?: string
  coordinator?: string
}

export default function VolunteerDashboard() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [application, setApplication] = useState<ApplicationData | null>(null)
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null)
  const [selectedProject, setSelectedProject] = useState<SelectedProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoursWorked, setHoursWorked ] = useState(0)
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [taskStats, setTaskStats] = useState<any | null>(null)
  const [eventStats, setEventStats] = useState<any | null>(null)
  const [meetingStats, setMeetingStats] = useState<any | null>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [socialPosts, setSocialPosts] = useState<any[]>([])
  const [missingPostsCount, setMissingPostsCount] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [viewingPost, setViewingPost] = useState<string | null>(null)
  const [viewAllNotifications, setViewAllNotifications] = useState(false)
  const [viewAllAnnouncements, setViewAllAnnouncements] = useState(false)
  
  // Refresh function to refetch data
  const fetchDashboardData = async () => {
    try {
      const [profileRes, appRes, projectRes, eventsRes, statsRes, announcementsRes, socialPostsRes] = await Promise.all([
        fetch("/api/volunteer/profile"),
        fetch("/api/volunteer/application"),
        fetch("/api/volunteer/projects"),
        fetch("/api/volunteer/events"),
        fetch("/api/volunteer/stats"),
        fetch("/api/volunteer/announcements"),
        fetch("/api/volunteer/social-posts"),
      ])

      const profileData = await profileRes.json()
      const appData = await appRes.json()
      const projectData = await projectRes.json()
      const eventsData = await eventsRes.json()
      const statsData = await statsRes.json()
      const announcementsData = await announcementsRes.json()
      const socialPostsData = await socialPostsRes.json()

      if (profileData.success) {
        setCompletion(profileData.completion)
        // If profile not complete, redirect to profile page
        if (profileData.completion.percent < 100) {
          router.push("/dashboard/profile")
          return
        }
      }

      if (appData.success && appData.application) {
        const app = appData.application
        setApplication({
          _id: app._id,
          nameEnglish: app.nameEnglish,
          institutionName: app.institutionName,
          formNo: app.formNo,
          status: app.status,
          submittedAt: app.submittedAt,
          reviewedAt: app.reviewedAt,
        })
      }

      if (projectData.success) {
        if (projectData.selectedProject) {
          setSelectedProject(projectData.selectedProject)
        } else if (profileData.completion?.percent === 100) {
          // Profile complete but no project selected - redirect to projects
          router.push("/dashboard/projects")
          return
        }
      }

      if (statsData.success) {
        setHoursWorked(statsData.hoursWorked ?? statsData.totalHours ?? 0)
        setUpcomingEvents(statsData.upcomingEvents || [])
        setTaskStats(statsData.tasks || null)
        setEventStats(statsData.events || null)
        setMeetingStats(statsData.meetings || null)
      }

      if (announcementsData.success) {
        setNotifications(announcementsData.notifications || [])
        setAnnouncements(announcementsData.announcements || [])
      }

      if (socialPostsData.success) {
        setSocialPosts(socialPostsData.posts || [])
        setMissingPostsCount(socialPostsData.missingCount || 0)
        setTotalPoints(socialPostsData.totalPoints || 0)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === "loading") return
    const user = session?.user as any
    if (!user) {
      router.replace("/login")
      return
    }
    if (user.role !== "volunteer" && user.role !== "user") {
      router.replace("/")
      return
    }
    if (user.mustChangePassword) {
      router.replace("/set-password")
      return
    }

    fetchDashboardData()
  }, [session, status, router])

  // Calculate display announcements before conditional return
  const sortedAnnouncements = [...announcements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const displayAnnouncements = viewAllAnnouncements ? sortedAnnouncements : sortedAnnouncements.slice(0, 5)

  // Mark announcements as viewed when displayed (must be before conditional return)
  useEffect(() => {
    if (announcements.length === 0 || displayAnnouncements.length === 0) return

    const markAnnouncementsAsViewed = async () => {
      try {
        // Mark all displayed announcements as viewed
        await Promise.allSettled(
          displayAnnouncements.map((announcement) =>
            fetch("/api/volunteer/announcements/view", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ announcementId: announcement._id }),
            })
          )
        )
      } catch (error) {
        console.error("Error marking announcements as viewed:", error)
      }
    }

    // Small delay to ensure announcements are rendered
    const timer = setTimeout(() => {
      markAnnouncementsAsViewed()
    }, 1000)

    return () => clearTimeout(timer)
  }, [announcements, displayAnnouncements])

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    )
  }

  const user = session?.user as any

  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const unreadNotifications = sortedNotifications.filter((n) => !n.isRead)
  const readNotifications = sortedNotifications.filter((n) => n.isRead)
  const limitedUnreadNotifications = viewAllNotifications ? unreadNotifications : unreadNotifications.slice(0, 10)
  const limitedReadNotifications = viewAllNotifications ? readNotifications : readNotifications.slice(0, 5)
  const displayNotifications = [...limitedUnreadNotifications, ...limitedReadNotifications]
  const hasMoreNotifications =
    unreadNotifications.length > limitedUnreadNotifications.length ||
    readNotifications.length > limitedReadNotifications.length

  const hasMoreAnnouncements = sortedAnnouncements.length > displayAnnouncements.length

  const latestAnnouncement = sortedAnnouncements[0]
  const latestNotification = sortedNotifications[0]
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      submitted: { label: "Submitted", color: "bg-blue-100 text-blue-800 border-blue-200", icon: FileText },
      "under-review": { label: "Under Review", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: AlertCircle },
      approved: { label: "Approved", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
      rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.submitted
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </span>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-xl p-6 md:p-8 border border-primary/20 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 flex items-center">
              <Award className="w-8 h-8 mr-3 text-primary" />
              Welcome, {user?.name || "Volunteer"}!
            </h1>
            <p className="text-muted-foreground">Manage your NSS activities and track your progress</p>
          </div>
          {completion && completion.percent === 100 && (
            <div className="mt-4 md:mt-0">
              <div className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold text-center">
                Profile Complete ✓
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Live ticker for latest announcement & notification */}
      {(latestAnnouncement || latestNotification) && (() => {
        // Function to convert URLs to clickable links
        const linkify = (text: string) => {
          if (!text) return null
          const urlRegex = /(https?:\/\/[^\s]+)/g
          const parts = text.split(urlRegex)
          return parts.map((part, i) => 
            urlRegex.test(part) ? (
              <a 
                key={i} 
                href={part} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {part}
              </a>
            ) : (
              <span key={i}>{part}</span>
            )
          )
        }

        // Combine announcement and notification text
        const announcementText = latestAnnouncement 
          ? `Announcement: ${latestAnnouncement.title}${latestAnnouncement.content ? " - " + latestAnnouncement.content.slice(0, 120) + (latestAnnouncement.content.length > 120 ? "..." : "") : ""}`
          : ""
        
        const notificationText = latestNotification
          ? `Notification: ${latestNotification.title}${latestNotification.content ? " - " + latestNotification.content.slice(0, 120) + (latestNotification.content.length > 120 ? "..." : "") : ""}`
          : ""

        const combinedText = [announcementText, notificationText].filter(Boolean).join(" • ")

        return (
          <div className="bg-background/60 border border-primary/20 rounded-lg px-4 py-2 text-xs md:text-sm overflow-hidden relative">
            <div className="whitespace-nowrap">
              <div className="animate-marquee">
                <div className="inline-flex items-center gap-4">
                  {latestAnnouncement && (
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-semibold">Announcement:</span>
                      <span className="opacity-90">
                        {linkify(latestAnnouncement.title + (latestAnnouncement.content ? " - " + latestAnnouncement.content.slice(0, 120) + (latestAnnouncement.content.length > 120 ? "..." : "") : ""))}
                      </span>
                    </div>
                  )}
                  {latestNotification && (
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-semibold">Notification:</span>
                      <span className="opacity-90">
                        {linkify(latestNotification.title + (latestNotification.content ? " - " + latestNotification.content.slice(0, 120) + (latestNotification.content.length > 120 ? "..." : "") : ""))}
                      </span>
                    </div>
                  )}
                </div>
                {/* Duplicate for seamless infinite loop */}
                <div className="inline-flex items-center gap-4 ml-8">
                  {latestAnnouncement && (
                    <div className="flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-semibold">Announcement:</span>
                      <span className="opacity-90">
                        {linkify(latestAnnouncement.title + (latestAnnouncement.content ? " - " + latestAnnouncement.content.slice(0, 120) + (latestAnnouncement.content.length > 120 ? "..." : "") : ""))}
                      </span>
                    </div>
                  )}
                  {latestNotification && (
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-semibold">Notification:</span>
                      <span className="opacity-90">
                        {linkify(latestNotification.title + (latestNotification.content ? " - " + latestNotification.content.slice(0, 120) + (latestNotification.content.length > 120 ? "..." : "") : ""))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Top Summary Bar */}
      <div className="grid grid-cols-1 xl:grid-cols-4 md:grid-cols-2 gap-4">
        {/* Total Hours */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Total Hours
            </h3>
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold text-foreground mb-2">{hoursWorked.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">Cumulative volunteering hours</p>
          {completion && (
            <div className="mt-4 pt-3 border-t border-border/60">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Profile Completion</span>
                <span className="font-semibold text-primary">{completion.percent}%</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${completion.percent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Announcements Snapshot */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Announcements
            </h3>
            <Megaphone className="w-5 h-5 text-primary" />
          </div>
          {announcements.length === 0 ? (
            <div className="text-sm text-muted-foreground">No announcements right now</div>
          ) : announcements.length > 2 ? (
            <div className="h-[140px] overflow-hidden relative">
              <div className="animate-scroll-up">
                {/* First set */}
                {announcements.map((announcement) => {
                  const linkify = (text: string) => {
                    const urlRegex = /(https?:\/\/[^\s]+)/g
                    const parts = text.split(urlRegex)
                    return parts.map((part, i) => 
                      urlRegex.test(part) ? (
                        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {part}
                        </a>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    )
                  }
                  return (
                    <div key={announcement._id} className="p-3 bg-muted/40 rounded-lg border border-border/40 mb-3">
                      <p className="text-sm font-semibold text-foreground line-clamp-1">{announcement.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{linkify(announcement.content)}</p>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        {new Date(announcement.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  )
                })}
                {/* Duplicate set for seamless loop */}
                {announcements.map((announcement) => {
                  const linkify = (text: string) => {
                    const urlRegex = /(https?:\/\/[^\s]+)/g
                    const parts = text.split(urlRegex)
                    return parts.map((part, i) => 
                      urlRegex.test(part) ? (
                        <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          {part}
                        </a>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    )
                  }
                  return (
                    <div key={`${announcement._id}-dup`} className="p-3 bg-muted/40 rounded-lg border border-border/40 mb-3">
                      <p className="text-sm font-semibold text-foreground line-clamp-1">{announcement.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{linkify(announcement.content)}</p>
                      <p className="text-[11px] text-muted-foreground mt-2">
                        {new Date(announcement.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((announcement) => {
                const linkify = (text: string) => {
                  const urlRegex = /(https?:\/\/[^\s]+)/g
                  const parts = text.split(urlRegex)
                  return parts.map((part, i) => 
                    urlRegex.test(part) ? (
                      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {part}
                      </a>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )
                }
                return (
                  <div key={announcement._id} className="p-3 bg-muted/40 rounded-lg border border-border/40">
                    <p className="text-sm font-semibold text-foreground line-clamp-1">{announcement.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{linkify(announcement.content)}</p>
                    <p className="text-[11px] text-muted-foreground mt-2">
                      {new Date(announcement.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
          {hasMoreAnnouncements && (
            <Link
              href="#announcements-section"
              className="inline-flex items-center text-xs text-primary hover:text-primary/80 mt-3"
            >
              View all announcements <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-all">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Quick Actions
          </h3>
          <div className="space-y-2">
            <Link
              href="/dashboard/profile"
              className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/50 hover:bg-muted transition-colors text-sm"
            >
              <span>Update Profile</span>
              <User className="w-4 h-4 text-primary" />
            </Link>
            <Link
              href="/dashboard/events"
              className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/50 hover:bg-muted transition-colors text-sm"
            >
              <span>Browse Events</span>
              <Calendar className="w-4 h-4 text-primary" />
            </Link>
            <Link
              href="/dashboard/tasks"
              className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/50 hover:bg-muted transition-colors text-sm"
            >
              <span>Open Tasks</span>
              <FolderKanban className="w-4 h-4 text-primary" />
            </Link>
            {application && application.status === "approved" && (
              <a
                href={`/api/generate-pdf?id=${application._id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-lg border border-border/50 hover:bg-muted transition-colors text-sm"
              >
                <span>Download Certificate</span>
                <FileText className="w-4 h-4 text-primary" />
              </a>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-all relative">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Notifications
            </h3>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg border border-border/60 hover:bg-muted transition-colors"
              title="Open notifications"
            >
              <Bell className="w-5 h-5 text-primary" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadNotificationCount}
                </span>
              )}
            </button>
          </div>
          {displayNotifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">You’re all caught up!</p>
          ) : (
            <div className="space-y-2">
              {displayNotifications.slice(0, 3).map((notif) => (
                <div
                  key={notif._id}
                  className={`p-3 rounded-lg border text-xs ${
                    notif.isRead ? "bg-muted/30 border-border/30" : "bg-muted/60 border-border/60"
                  }`}
                >
                  <p className="font-medium text-foreground line-clamp-1">{notif.title}</p>
                  <p className="text-muted-foreground line-clamp-2">{notif.content}</p>
                </div>
              ))}
            </div>
          )}
          {hasMoreNotifications && !viewAllNotifications && (
            <button
              onClick={() => {
                setViewAllNotifications(true)
                setShowNotifications(true)
              }}
              className="mt-3 text-xs text-primary hover:text-primary/80 flex items-center"
            >
              View all notifications <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          )}

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-full right-0 mt-3 w-full sm:w-96 bg-card rounded-xl border border-border shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-foreground text-sm">Latest Notifications</h4>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {displayNotifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No new notifications</p>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {displayNotifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`p-3 rounded-lg border cursor-pointer ${
                        notif.isRead
                          ? "bg-muted/30 border-border/30 opacity-70"
                          : "bg-muted/50 border-border/50"
                      }`}
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (!notif.isRead) {
                          try {
                            const updatedNotifications = notifications.map((n) =>
                              n._id === notif._id ? { ...n, isRead: true } : n
                            )
                            setNotifications(updatedNotifications)

                            const res = await fetch("/api/volunteer/notifications/read", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ announcementId: notif._id }),
                            })

                            if (!res.ok) {
                              setNotifications((prev) =>
                                prev.map((n) =>
                                  n._id === notif._id ? { ...n, isRead: false } : n
                                )
                              )
                            } else {
                              try {
                                const refreshRes = await fetch("/api/volunteer/announcements")
                                const refreshData = await refreshRes.json()
                                if (refreshData.success) {
                                  setNotifications(refreshData.notifications || [])
                                  setAnnouncements(refreshData.announcements || [])
                                }
                              } catch (refreshError) {
                                console.error("Error refreshing notifications:", refreshError)
                              }
                            }
                          } catch (error) {
                            console.error("Error marking notification as read:", error)
                            setNotifications((prev) =>
                              prev.map((n) =>
                                n._id === notif._id ? { ...n, isRead: false } : n
                              )
                            )
                          }
                        }
                      }}
                    >
                      <p className="font-medium text-sm text-foreground mb-1">{notif.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{notif.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {hasMoreNotifications && (
                <button
                  onClick={() => setViewAllNotifications((prev) => !prev)}
                  className="mt-3 w-full text-xs text-primary hover:text-primary/80 flex items-center justify-center gap-1"
                >
                  {viewAllNotifications ? (
                    <>
                      View less <ArrowRight className="w-3 h-3 rotate-180" />
                    </>
                  ) : (
                    <>
                      View more <ArrowRight className="w-3 h-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      {(taskStats || eventStats || meetingStats) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Tasks Stats */}
          {taskStats && (
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-primary" />
                  Tasks
                </h3>
                <span className="text-xs text-muted-foreground">Total: {taskStats.total}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/40 border border-border/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Pending</p>
                  <p className="text-lg font-bold">{taskStats.pending}</p>
                </div>
                <div className="bg-muted/40 border border-border/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">In Progress</p>
                  <p className="text-lg font-bold">{taskStats.inProgress}</p>
                </div>
                <div className="bg-muted/40 border border-border/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Completed</p>
                  <p className="text-lg font-bold">{taskStats.completed}</p>
                </div>
                <div className="bg-muted/40 border border-border/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Cancelled</p>
                  <p className="text-lg font-bold">{taskStats.cancelled}</p>
                </div>
              </div>
              <div className="mt-3">
                <Link href="/dashboard/tasks" className="text-xs text-primary hover:text-primary/80">
                  View all tasks →
                </Link>
              </div>
            </div>
          )}

          {/* Events Stats */}
          {eventStats && (
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-primary" />
                  Events
                </h3>
                <span className="text-xs text-muted-foreground">Total: {eventStats.totalEvents}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/40 border border-border/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Upcoming/Ongoing</p>
                  <p className="text-lg font-bold">{eventStats.upcomingOrOngoing}</p>
                </div>
                <div className="bg-muted/40 border border-border/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Registered</p>
                  <p className="text-lg font-bold">{eventStats.registered}</p>
                </div>
                <div className="bg-muted/40 border border-border/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Attended</p>
                  <p className="text-lg font-bold">{eventStats.attended}</p>
                </div>
                <div className="bg-muted/40 border border-border/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Not Attended</p>
                  <p className="text-lg font-bold">{eventStats.notAttended}</p>
                </div>
              </div>
              <div className="mt-3">
                <Link href="/dashboard/events" className="text-xs text-primary hover:text-primary/80">
                  Manage events →
                </Link>
              </div>
            </div>
          )}

          {/* Meetings Stats (placeholder) */}
          {meetingStats && (
            <div className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-foreground flex items-center">
                  <Users className="w-4 h-4 mr-2 text-primary" />
                  Meetings
                </h3>
                <span className="text-xs text-muted-foreground">Total: {meetingStats.total}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-muted/40 border border-border/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Attended</p>
                  <p className="text-lg font-bold">{meetingStats.attended}</p>
                </div>
                <div className="bg-muted/40 border border-border/50 rounded-lg p-3">
                  <p className="text-muted-foreground text-xs mb-1">Not Attended</p>
                  <p className="text-lg font-bold">{meetingStats.notAttended}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Application Status Card */}
          {application && (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center mb-2 sm:mb-0">
                  <FileText className="w-5 h-5 mr-2 text-primary" />
                  Application Status
                </h2>
                {getStatusBadge(application.status)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Application Number</p>
                  <p className="text-xl font-bold text-foreground">{application.formNo}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">Institution</p>
                  <p className="text-lg font-semibold text-foreground truncate">{application.institutionName}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  Submitted: {new Date(application.submittedAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
                {application.reviewedAt && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Reviewed: {new Date(application.reviewedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                )}
              </div>

              {application.status === "approved" && (
                <div className="mt-4 pt-4 border-t border-border">
                  <a
                    href={`/api/generate-pdf?id=${application._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Download Application PDF
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Selected Project Card */}
        {/* Social Media Posts Section */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg">
                <Share2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Latest NSS Posts</h2>
                <p className="text-xs text-muted-foreground">Stay updated with NSS activities</p>
              </div>
            </div>
            {missingPostsCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-full text-xs font-semibold">
                <AlertCircle className="w-3 h-3" />
                {missingPostsCount} Missing
              </div>
            )}
          </div>

          {socialPosts.length === 0 ? (
            <div className="text-center py-8">
              <Share2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground">No social media posts available</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {socialPosts.map((post) => {
                const platformIcons: any = {
                  facebook: Facebook,
                  instagram: Instagram,
                  twitter: Twitter,
                  linkedin: Linkedin,
                  youtube: Youtube,
                }
                const platformColors: any = {
                  facebook: "bg-blue-600 hover:bg-blue-700",
                  instagram: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
                  twitter: "bg-black hover:bg-gray-900",
                  linkedin: "bg-blue-700 hover:bg-blue-800",
                  youtube: "bg-red-600 hover:bg-red-700",
                }
                const platformLabels: any = {
                  facebook: "Facebook",
                  instagram: "Instagram",
                  twitter: "Twitter",
                  linkedin: "LinkedIn",
                  youtube: "YouTube",
                }

                const platformLinks = post.platformLinks || {}
                const availablePlatforms = Object.keys(platformLinks).filter((key) => platformLinks[key])
                const clickedPlatforms = post.clickedPlatforms || []
                const likedPlatforms = post.likedPlatforms || []
                const mainPlatforms = ["facebook", "instagram", "twitter", "linkedin"]
                const availableMainPlatforms = mainPlatforms.filter((p) => platformLinks[p])
                const allMainPlatformsLiked = availableMainPlatforms.every((p) => likedPlatforms.includes(p))

                return (
                  <div
                    key={post._id}
                    className={`group relative border rounded-xl overflow-hidden transition-all duration-300 ${
                      allMainPlatformsLiked && availableMainPlatforms.length > 0
                        ? "border-green-500/50 bg-green-50/30 dark:bg-green-950/10 shadow-md"
                        : likedPlatforms.length > 0
                          ? "border-yellow-500/50 bg-yellow-50/30 dark:bg-yellow-950/10 shadow-sm"
                          : "border-primary/50 bg-gradient-to-r from-primary/5 to-secondary/5 shadow-sm hover:shadow-md"
                    }`}
                  >
                    {/* Status Badge */}
                    {allMainPlatformsLiked && availableMainPlatforms.length > 0 ? (
                      <div className="absolute top-3 right-3 z-10">
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded-full text-xs font-medium shadow-md">
                          <CheckCircle className="w-3 h-3" />
                          Complete
                        </div>
                      </div>
                    ) : likedPlatforms.length > 0 ? (
                      <div className="absolute top-3 right-3 z-10">
                        <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white rounded-full text-xs font-medium shadow-md">
                          <Star className="w-3 h-3" />
                          {likedPlatforms.length}/{availableMainPlatforms.length}
                        </div>
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3 z-10">
                        <div className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-medium animate-pulse shadow-md">
                          <Eye className="w-3 h-3" />
                          New
                        </div>
                      </div>
                    )}

                    {/* Post Content */}
                    <div className="p-4">
                      <div className="mb-3">
                        <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{post.title}</h3>
                        {post.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{post.description}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            +2 points per platform • +10 points total when all completed
                          </span>
                        </div>
                      </div>

                      {/* Platform Buttons */}
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {availableMainPlatforms.map((platform) => {
                          const PlatformIcon = platformIcons[platform] || Share2
                          const isLiked = likedPlatforms.includes(platform)
                          const isProcessing = viewingPost === `${post._id}-${platform}`

                          return (
                            <button
                              key={platform}
                              onClick={async (e) => {
                                e.preventDefault()
                                if (!isLiked && !isProcessing) {
                                  setViewingPost(`${post._id}-${platform}`)
                                  
                                  try {
                                    // First record the click
                                    await fetch("/api/volunteer/social-posts", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ postId: post._id, platform, action: "click" }),
                                    })
                                    
                                    // Open the platform link
                                    window.open(platformLinks[platform], "_blank")
                                  
                                    // Show confirmation modal after a short delay
                                    setTimeout(async () => {
                                      const confirmed = confirm(
                                        `Did you like the post on ${platformLabels[platform]}?\n\nPlease like the post on the platform and then confirm here to earn 2 points.`
                                      )
                                      
                                      if (confirmed) {
                                        try {
                                          const res = await fetch("/api/volunteer/social-posts", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ postId: post._id, platform, action: "like" }),
                                          })
                                          const data = await res.json()
                                          if (data.success) {
                                            // Update local state
                                            setSocialPosts((prev) =>
                                              prev.map((p) =>
                                                p._id === post._id
                                                  ? {
                                                      ...p,
                                                      clickedPlatforms: [...(p.clickedPlatforms || []), platform],
                                                      likedPlatforms: [...(p.likedPlatforms || []), platform],
                                                    }
                                                  : p
                                              )
                                            )
                                            setTotalPoints(data.totalPoints)
                                            
                                            if (data.pointsAwarded) {
                                              alert(`🎉 Congratulations! You earned ${data.pointsEarned} points for completing all platforms! Total: ${data.totalPoints}`)
                                            } else {
                                              const remaining = availableMainPlatforms.length - (likedPlatforms.length + 1)
                                              if (remaining > 0) {
                                                alert(`✅ Great! You earned 2 points for ${platformLabels[platform]}. ${remaining} more platform${remaining > 1 ? 's' : ''} to go!`)
                                              } else {
                                                alert(`✅ Great! You earned 2 points for ${platformLabels[platform]}!`)
                                              }
                                            }
                                            await fetchDashboardData()
                                          }
                                        } catch (error) {
                                          console.error("Error recording platform like:", error)
                                          alert("Failed to record your like. Please try again.")
                                        } finally {
                                          setViewingPost(null)
                                        }
                                      } else {
                                        setViewingPost(null)
                                      }
                                    }, 500)
                                  } catch (error) {
                                    console.error("Error recording platform click:", error)
                                    setViewingPost(null)
                                  }
                                }
                              }}
                              disabled={isProcessing || isLiked}
                              className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white font-medium text-sm transition-all ${
                                isLiked
                                  ? `${platformColors[platform]} opacity-75 cursor-default relative`
                                  : `${platformColors[platform]} hover:shadow-md active:scale-95`
                              } ${isProcessing ? "opacity-50" : ""}`}
                            >
                              {isProcessing ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <PlatformIcon className="w-4 h-4" />
                                  <span>{platformLabels[platform]}</span>
                                  {isLiked && (
                                    <CheckCircle className="w-4 h-4 ml-1" />
                                  )}
                                </>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {/* Progress */}
                      {likedPlatforms.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-semibold text-foreground">
                              {likedPlatforms.length}/{availableMainPlatforms.length} platforms • {likedPlatforms.length * 2} points earned
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-primary to-secondary h-2.5 rounded-full transition-all duration-500 flex items-center justify-end pr-1"
                              style={{ width: `${(likedPlatforms.length / availableMainPlatforms.length) * 100}%` }}
                            >
                              {allMainPlatformsLiked && (
                                <CheckCircle className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>
                          {allMainPlatformsLiked && (
                            <div className="mt-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                              <p className="text-xs text-green-700 dark:text-green-400 font-medium text-center flex items-center justify-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                All platforms completed! +10 points awarded
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Points Display */}
          {totalPoints > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm font-medium text-foreground">Your Points</span>
                </div>
                <span className="text-lg font-bold text-primary">{totalPoints}</span>
              </div>
            </div>
          )}
        </div>

        {/* Upcoming Events (Main Card) */}
        {upcomingEvents.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold text-foreground mb-4">Upcoming Events</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingEvents.slice(0, 4).map((event) => (
                <div key={event._id} className="p-4 border rounded-lg hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => router.push("/dashboard/events")}>
                  <p className="font-semibold text-foreground mb-1">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.eventDate).toLocaleDateString()} {event.startTime && `• ${new Date(event.startTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

          {/* Profile Completion Alert */}
          {completion && completion.percent < 100 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-800 mb-2">Complete Your Profile</h3>
                  <p className="text-yellow-700 text-sm mb-3">
                    Your profile is {completion.percent}% complete. Please complete the missing information to continue.
                  </p>
                  <Link
                    href="/dashboard/profile"
                    className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                  >
                    Complete Profile
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* No Project Selected Alert */}
          {completion && completion.percent === 100 && !selectedProject && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start">
                <FolderKanban className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-800 mb-2">Select Your NSS Project</h3>
                  <p className="text-blue-700 text-sm mb-3">
                    Your profile is complete! Now select a project to participate in NSS activities.
                  </p>
                  <Link
                    href="/dashboard/projects"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Select Project
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {!application && (
            <div className="bg-card rounded-xl border border-border p-8 md:p-12 text-center">
              <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Application Found</h3>
              <p className="text-muted-foreground mb-4">You haven't submitted an application yet.</p>
              <Link
                href="/register"
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Apply Now
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6" id="announcements">
          {/* Upcoming Events */}
          {upcomingEvents.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                Upcoming Events
              </h3>
              <div className="space-y-3">
                {upcomingEvents.slice(0, 3).map((event) => (
                  <div
                    key={event._id}
                    className="p-3 bg-muted/50 rounded-lg border border-border/50 hover:bg-muted transition-colors cursor-pointer"
                    onClick={() => router.push("/dashboard/events")}
                  >
                    <p className="font-medium text-sm text-foreground mb-1">{event.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(event.eventDate).toLocaleDateString()}
                        {event.startTime && ` • ${new Date(event.startTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}
                      </span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                ))}
                {upcomingEvents.length > 3 && (
                  <Link
                    href="/dashboard/events"
                    className="block text-center text-sm text-primary hover:text-primary/80 font-medium mt-2"
                  >
                    View All Events →
                  </Link>
                )}
              </div>
            </div>
          )}

        {/* Announcements */}
        {/* {sortedAnnouncements.length > 0 && (
          <div id="announcements-section" className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Announcements</h3>
              </div>
              {hasMoreAnnouncements && (
                <button
                  onClick={() => setViewAllAnnouncements((prev) => !prev)}
                  className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                >
                  {viewAllAnnouncements ? "View less" : "View more"}
                  <ArrowRight className={`w-3 h-3 transition-transform ${viewAllAnnouncements ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {displayAnnouncements.map((announcement) => {
                // Convert URLs to clickable links
                const linkify = (text: string) => {
                  const urlRegex = /(https?:\/\/[^\s]+)/g
                  const parts = text.split(urlRegex)
                  return parts.map((part, i) => 
                    urlRegex.test(part) ? (
                      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {part}
                      </a>
                    ) : (
                      <span key={i}>{part}</span>
                    )
                  )
                }
                return (
                <div
                  key={announcement._id}
                  className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
                >
                  <p className="font-semibold text-sm text-foreground mb-2">{announcement.title}</p>
                  <div className="text-xs text-muted-foreground mb-2 line-clamp-3">
                    {linkify(announcement.content)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(announcement.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              )
              })}
            </div>
          </div>
        )} */}
          {/* My NSS Project */}
          {selectedProject && (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground flex items-center">
                  <FolderKanban className="w-5 h-5 mr-2 text-primary" />
                  My NSS Project
                </h2>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  Active
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{selectedProject.title}</h3>
                  <p className="text-muted-foreground">{selectedProject.description}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedProject.location && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mr-2" />
                      {selectedProject.location}
                    </div>
                  )}
                  {selectedProject.coordinator && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="w-4 h-4 mr-2" />
                      {selectedProject.coordinator}
                    </div>
                  )}
                </div>

                <Link
                  href="/dashboard/projects"
                  className="inline-flex items-center text-primary hover:text-primary/80 text-sm font-medium"
                >
                  View Project Details
                  <TrendingUp className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          )}

          {/* Follow NSS */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">Follow NSS</h3>
            <OfficialNssLinks />
          </div>
        </div>
      </div>
    </div>
  )
}

// Lightweight client component to render official NSS links from admin settings
function OfficialNssLinks() {
  const [links, setLinks] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/social-links')
        const data = await res.json()
        if (data.success) setLinks(data.links)
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-sm text-muted-foreground">Loading...</div>
  if (!links) return <div className="text-sm text-muted-foreground">No links configured</div>

  const icons = [
    { key: 'facebook', label: 'Facebook', url: links.facebook, bg: 'bg-blue-600', svg: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M22 12a10 10 0 10-11.5 9.9v-7h-2.7V12h2.7V9.7c0-2.7 1.6-4.2 4-4.2 1.2 0 2.5.2 2.5.2v2.7h-1.4c-1.4 0-1.9.9-1.9 1.8V12h3.2l-.5 2.9h-2.7v7A10 10 0 0022 12z"/></svg>
    )},
    { key: 'instagram', label: 'Instagram', url: links.instagram, bg: 'bg-gradient-to-tr from-yellow-500 via-pink-600 to-purple-700', svg: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H7zm5 3a5 5 0 110 10 5 5 0 010-10zm0 2.2a2.8 2.8 0 100 5.6 2.8 2.8 0 000-5.6zM18 6.5a1 1 0 110 2 1 1 0 010-2z"/></svg>
    )},
    { key: 'twitter', label: 'Twitter/X', url: links.twitter, bg: 'bg-black', svg: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M3 3l8.2 10.2L3.6 21h2.2l6.1-6.7 4.9 6.7H21l-8.7-11.9L20.3 3h-2.2l-5.5 6.1L8.1 3H3z"/></svg>
    )},
    { key: 'linkedin', label: 'LinkedIn', url: links.linkedin, bg: 'bg-sky-700', svg: (
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8.98h5V24H0V8.98zM8.98 8.98h4.78v2.05h.07c.67-1.27 2.3-2.6 4.73-2.6 5.06 0 6 3.33 6 7.66V24h-5v-6.8c0-1.62-.03-3.7-2.25-3.7-2.25 0-2.6 1.76-2.6 3.58V24h-5V8.98z"/></svg>
    )},
  ]

  return (
    <div className="flex items-center gap-4">
      {icons.map((i) => (
        <a key={i.key}
           href={i.url || '#'}
           target={i.url ? '_blank' : undefined}
           className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-border ${i.bg} ${i.url ? 'opacity-100 hover:scale-105 transition-transform' : 'opacity-40 cursor-not-allowed'}`}
           aria-label={i.label}
        >
          {i.svg}
        </a>
      ))}
    </div>
  )
}
