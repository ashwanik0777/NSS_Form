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
  const [totalHours, setTotalHours] = useState(0)
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
        setTotalHours(statsData.totalHours || 0)
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
                const PlatformIcon = platformIcons[post.platform] || Share2
                const platformColors: any = {
                  facebook: "bg-blue-600",
                  instagram: "bg-gradient-to-r from-purple-500 to-pink-500",
                  twitter: "bg-black",
                  linkedin: "bg-blue-700",
                  youtube: "bg-red-600",
                }

                return (
                  <div
                    key={post._id}
                    className={`group relative border rounded-xl overflow-hidden transition-all duration-300 ${
                      post.isViewed
                        ? "border-border bg-muted/30 opacity-90"
                        : "border-primary/50 bg-gradient-to-r from-primary/5 to-secondary/5 shadow-sm hover:shadow-md"
                    }`}
                  >
                    {/* View Badge */}
                    {post.isViewed ? (
                      <div className="absolute top-3 right-3 z-10">
                        <div className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" />
                          Viewed
                        </div>
                      </div>
                    ) : (
                      <div className="absolute top-3 right-3 z-10">
                        <div className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-medium animate-pulse">
                          <Eye className="w-3 h-3" />
                          New
                        </div>
                      </div>
                    )}

                    {/* Post Content */}
                    <div className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${platformColors[post.platform] || "bg-primary"} text-white flex-shrink-0`}>
                          <PlatformIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground mb-1 line-clamp-1">{post.title}</h3>
                          {post.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{post.description}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="capitalize">{post.platform}</span>
                            {post.pointsReward > 0 && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-yellow-500" />
                                  +{post.pointsReward} points
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Post Image */}
                      {post.image && (
                        <div className="mb-3 rounded-lg overflow-hidden">
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = "none"
                            }}
                          />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {post.postUrl ? (
                          <a
                            href={post.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={async () => {
                              if (!post.isViewed) {
                                setViewingPost(post._id)
                                try {
                                  const res = await fetch("/api/volunteer/social-posts", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ postId: post._id }),
                                  })
                                  const data = await res.json()
                                  if (data.success) {
                                    // Update local state
                                    setSocialPosts((prev) =>
                                      prev.map((p) =>
                                        p._id === post._id
                                          ? { ...p, isViewed: true, viewedAt: new Date() }
                                          : p
                                      )
                                    )
                                    setMissingPostsCount((prev) => Math.max(0, prev - 1))
                                    if (data.pointsAwarded) {
                                      setTotalPoints(data.totalPoints)
                                      // Show success message
                                      alert(`🎉 You earned ${data.pointsEarned} points! Total: ${data.totalPoints}`)
                                    }
                                    await fetchDashboardData()
                                  }
                                } catch (error) {
                                  console.error("Error recording view:", error)
                                } finally {
                                  setViewingPost(null)
                                }
                              }
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
                          >
                            {viewingPost === post._id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Opening...
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-4 h-4" />
                                {post.isViewed ? "View Post" : "View & Earn Points"}
                              </>
                            )}
                          </a>
                        ) : (
                          <button
                            onClick={async () => {
                              if (!post.isViewed) {
                                setViewingPost(post._id)
                                try {
                                  const res = await fetch("/api/volunteer/social-posts", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ postId: post._id }),
                                  })
                                  const data = await res.json()
                                  if (data.success) {
                                    setSocialPosts((prev) =>
                                      prev.map((p) =>
                                        p._id === post._id
                                          ? { ...p, isViewed: true, viewedAt: new Date() }
                                          : p
                                      )
                                    )
                                    setMissingPostsCount((prev) => Math.max(0, prev - 1))
                                    if (data.pointsAwarded) {
                                      setTotalPoints(data.totalPoints)
                                      alert(`🎉 You earned ${data.pointsEarned} points! Total: ${data.totalPoints}`)
                                    }
                                    await fetchDashboardData()
                                  }
                                } catch (error) {
                                  console.error("Error recording view:", error)
                                } finally {
                                  setViewingPost(null)
                                }
                              }
                            }}
                            disabled={post.isViewed || viewingPost === post._id}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {viewingPost === post._id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Recording...
                              </>
                            ) : post.isViewed ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                Viewed
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4" />
                                Mark as Viewed (+{post.pointsReward} pts)
                              </>
                            )}
                          </button>
                        )}
                      </div>
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

        {/* Social Media Card (NSS Official Icons Only) */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Follow NSS</h2>
          </div>
          <OfficialNssLinks />
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
