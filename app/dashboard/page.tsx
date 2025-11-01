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
  const [totalHours, setTotalHours] = useState(0)
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  
  // Refresh function to refetch data
  const fetchDashboardData = async () => {
    try {
      const [profileRes, appRes, projectRes, eventsRes, statsRes, announcementsRes] = await Promise.all([
        fetch("/api/volunteer/profile"),
        fetch("/api/volunteer/application"),
        fetch("/api/volunteer/projects"),
        fetch("/api/volunteer/events"),
        fetch("/api/volunteer/stats"),
        fetch("/api/volunteer/announcements"),
      ])

      const profileData = await profileRes.json()
      const appData = await appRes.json()
      const projectData = await projectRes.json()
      const eventsData = await eventsRes.json()
      const statsData = await statsRes.json()
      const announcementsData = await announcementsRes.json()

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
        setTotalHours(statsData.totalHours || 0)
        setUpcomingEvents(statsData.upcomingEvents || [])
      }

      if (announcementsData.success) {
        setNotifications(announcementsData.notifications || [])
        setAnnouncements(announcementsData.announcements || [])
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

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    )
  }

  const user = session?.user as any
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
      <div className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-xl p-6 md:p-8 border border-primary/20">
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
        <div className="space-y-6">
          {/* Total Hours & Notification Button */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Total Hours</h3>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-muted rounded-lg transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5 text-foreground" />
                {notifications.filter((n) => !n.isRead).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications.filter((n) => !n.isRead).length}
                  </span>
                )}
              </button>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-primary/10 rounded-lg p-4 flex-1">
                <div className="flex items-center gap-2">
                  <Clock className="w-6 h-6 text-primary" />
                  <div>
                    <p className="text-2xl font-bold text-foreground">{totalHours.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Hours Worked</p>
                  </div>
                </div>
              </div>
            </div>
            {completion && (
              <div className="pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-1">Profile Completion</p>
                <p className="text-lg font-bold text-primary">{completion.percent}%</p>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="bg-card rounded-xl border border-border p-4 shadow-lg z-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Latest Notifications</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No new notifications</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className={`p-3 rounded-lg border ${
                        notif.isRead
                          ? "bg-muted/30 border-border/30 opacity-70"
                          : "bg-muted/50 border-border/50"
                      }`}
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (!notif.isRead) {
                          try {
                            // Optimistically update UI
                            const updatedNotifications = notifications.map((n) =>
                              n._id === notif._id ? { ...n, isRead: true } : n
                            )
                            setNotifications(updatedNotifications)
                            
                            // Mark as read on server
                            const res = await fetch("/api/volunteer/notifications/read", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ announcementId: notif._id }),
                            })
                            
                            if (!res.ok) {
                              // Revert on error
                              setNotifications((prev) =>
                                prev.map((n) =>
                                  n._id === notif._id ? { ...n, isRead: false } : n
                                )
                              )
                            } else {
                              // Refresh notifications from server to ensure sync
                              try {
                                const refreshRes = await fetch("/api/volunteer/announcements")
                                const refreshData = await refreshRes.json()
                                if (refreshData.success) {
                                  setNotifications(refreshData.notifications || [])
                                }
                              } catch (refreshError) {
                                console.error("Error refreshing notifications:", refreshError)
                              }
                            }
                          } catch (error) {
                            console.error("Error marking notification as read:", error)
                            // Revert on error
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
            </div>
          )}

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
          {announcements.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Megaphone className="w-5 h-5 mr-2 text-primary" />
                Announcements
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {announcements.map((announcement) => (
                  <div
                    key={announcement._id}
                    className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  >
                    <p className="font-semibold text-sm text-foreground mb-2">{announcement.title}</p>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-3">{announcement.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(announcement.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-2">
              {(!completion || completion.percent < 100) && (
                <Link
                  href="/dashboard/profile"
                  className="block px-4 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Complete Profile
                </Link>
              )}
              {completion && completion.percent === 100 && !selectedProject && (
                <Link
                  href="/dashboard/projects"
                  className="block px-4 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Select Project
                </Link>
              )}
              {selectedProject && (
                <Link
                  href="/dashboard/events"
                  className="flex items-center px-4 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View Events
                </Link>
              )}
              {application && application.status === "approved" && (
                <a
                  href={`/api/generate-pdf?id=${application._id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-2 text-sm text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Download PDF
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
