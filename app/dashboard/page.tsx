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
  CheckCircle2,
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
  CreditCard,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  Target,
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
  const [hoursWorked, setHoursWorked] = useState(0)
  const [eventHours, setEventHours] = useState(0)
  const [pendingEventHours, setPendingEventHours] = useState(0)
  const [meetingHours, setMeetingHours] = useState(0)
  const [taskHours, setTaskHours] = useState(0)
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
      const [profileRes, appRes, projectRes, eventsRes, statsRes, announcementsRes, socialPostsRes] =
        await Promise.all([
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
          router.push("/dashboard/projects")
          return
        }
      }

      if (statsData.success) {
        setHoursWorked(statsData.totalHours ?? 0)
        setEventHours(statsData.eventHours ?? 0)
        setPendingEventHours(statsData.pendingEventHours ?? 0)
        setMeetingHours(statsData.meetingHours ?? 0)
        setTaskHours(statsData.taskHours ?? 0)
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

  // Calculate display announcements
  const sortedAnnouncements = [...announcements].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const displayAnnouncements = viewAllAnnouncements
    ? sortedAnnouncements
    : sortedAnnouncements.slice(0, 5)

  // Mark announcements as viewed when displayed
  useEffect(() => {
    if (announcements.length === 0 || displayAnnouncements.length === 0) return

    const markAnnouncementsAsViewed = async () => {
      try {
        await Promise.allSettled(
          displayAnnouncements.map((announcement) =>
            fetch("/api/volunteer/announcements/view", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ announcementId: announcement._id }),
            }),
          ),
        )
      } catch (error) {
        console.error("Error marking announcements as viewed:", error)
      }
    }

    const timer = setTimeout(() => {
      markAnnouncementsAsViewed()
    }, 1000)

    return () => clearTimeout(timer)
  }, [announcements, displayAnnouncements])

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length

  if (status === "loading" || loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin w-9 h-9 text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading Volunteer Dashboard...</p>
      </div>
    )
  }

  const user = session?.user as any

  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const unreadNotifications = sortedNotifications.filter((n) => !n.isRead)
  const readNotifications = sortedNotifications.filter((n) => n.isRead)
  const limitedUnreadNotifications = viewAllNotifications
    ? unreadNotifications
    : unreadNotifications.slice(0, 10)
  const limitedReadNotifications = viewAllNotifications
    ? readNotifications
    : readNotifications.slice(0, 5)
  const displayNotifications = [...limitedUnreadNotifications, ...limitedReadNotifications]
  const hasMoreNotifications =
    unreadNotifications.length > limitedUnreadNotifications.length ||
    readNotifications.length > limitedReadNotifications.length

  const latestAnnouncement = sortedAnnouncements[0]
  const latestNotification = sortedNotifications[0]

  // NSS 2-Year Target Calculation (240 Hours for GBU NSS Certificate)
  const targetHours = 240
  const progressPercent = Math.min(100, Math.round((hoursWorked / targetHours) * 100))

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* ── 1. Hero / Welcome Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/95 to-secondary text-primary-foreground p-5 sm:p-7 md:p-8 shadow-lg shadow-primary/10">
        <div className="absolute -right-8 -bottom-10 w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute right-6 top-6 opacity-10 pointer-events-none hidden sm:block">
          <img src="/nssLogo.png" alt="" className="w-32 h-32 object-contain filter invert" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0 space-y-1.5 sm:space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>National Service Scheme • GBU</span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span className="truncate">Namaste, {user?.name || "Volunteer"}!</span>
            </h1>

            <p className="text-xs sm:text-sm text-primary-foreground/80 max-w-xl leading-relaxed">
              Track your service hours, register for community events, and access your official NSS
              credentials.
            </p>
          </div>

          {/* Quick Actions & Status Pill in Hero */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-2 md:pt-0 shrink-0">
            {application && application.status === "approved" && (
              <Link
                href="/dashboard/id-card"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-primary font-semibold text-xs sm:text-sm shadow-sm hover:bg-white/90 active:scale-95 transition-all"
              >
                <CreditCard className="w-4 h-4 text-primary" />
                <span>Digital ID Card</span>
              </Link>
            )}

            <Link
              href="/dashboard/events"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/20 active:scale-95 text-white font-medium text-xs sm:text-sm backdrop-blur-xs transition-all border border-white/20"
            >
              <Calendar className="w-4 h-4" />
              <span>Events</span>
            </Link>

            {completion && completion.percent === 100 ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-100 border border-emerald-400/30 text-xs font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>Profile 100%</span>
              </div>
            ) : (
              <Link
                href="/dashboard/profile"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-400/30 text-xs font-medium hover:bg-amber-500/30"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Complete Profile</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Live Announcement / Notification Ticker ── */}
      {(latestAnnouncement || latestNotification) && (() => {
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
                className="text-primary font-medium hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {part}
              </a>
            ) : (
              <span key={i}>{part}</span>
            ),
          )
        }

        return (
          <div className="bg-card border border-primary/20 rounded-xl p-3 shadow-xs flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
              <Megaphone className="w-4 h-4 animate-bounce" />
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="text-xs sm:text-sm text-foreground truncate">
                <span className="font-semibold text-primary mr-1.5">
                  {latestAnnouncement ? "Notice:" : "Update:"}
                </span>
                {latestAnnouncement
                  ? linkify(latestAnnouncement.title)
                  : latestNotification
                    ? linkify(latestNotification.title)
                    : null}
              </div>
            </div>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="text-xs text-primary font-medium hover:underline shrink-0 flex items-center gap-0.5"
            >
              <span>All Notices</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })()}

      {/* ── 3. Four Core Stat Cards (Desktop 4-Col, Mobile 2-Col) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Verified Hours */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Hours
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {hoursWorked.toFixed(1)}
              </span>
              <span className="text-xs text-muted-foreground font-medium">hrs</span>
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Verified Credit</span>
              {pendingEventHours > 0 && (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  +{pendingEventHours.toFixed(1)}h pending
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Events Overview */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Events
            </span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {eventStats?.attended ?? 0}
              </span>
              <span className="text-xs text-muted-foreground font-medium">attended</span>
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Registered: {eventStats?.registered ?? 0}</span>
              <Link href="/dashboard/events" className="text-primary hover:underline font-semibold">
                View &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Card 3: Tasks Overview */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tasks
            </span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {taskStats?.completed ?? 0}
              </span>
              <span className="text-xs text-muted-foreground font-medium">completed</span>
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Pending: {taskStats?.pending ?? 0}</span>
              <Link href="/dashboard/tasks" className="text-primary hover:underline font-semibold">
                Tasks &rarr;
              </Link>
            </div>
          </div>
        </div>

        {/* Card 4: Community Points */}
        <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              NSS Points
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
                {totalPoints}
              </span>
              <span className="text-xs text-muted-foreground font-medium">pts</span>
            </div>
            <div className="mt-2.5 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">
                {missingPostsCount > 0 ? `${missingPostsCount} posts open` : "All posts done"}
              </span>
              <span className="text-amber-600 font-semibold">&#9733; Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. NSS 2-Year Service Milestone Progress Bar ── */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-foreground">
                NSS 2-Year Service Milestone Tracker
              </h3>
              <p className="text-xs text-muted-foreground">
                Official Requirement: 240 Service Hours over 2 years (120 hrs/year) for Degree
                Certificate
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-lg font-extrabold text-foreground">{hoursWorked.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground font-medium"> / {targetHours} hrs</span>
            <span className="ml-2 text-xs font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10">
              {progressPercent}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden p-0.5">
          <div
            className="bg-gradient-to-r from-primary via-secondary to-emerald-500 h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${Math.max(5, progressPercent)}%` }}
          />
        </div>

        {/* Milestone Milestones Chips */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/60 text-center text-xs">
          <div className="p-1.5 rounded-lg bg-muted/40">
            <span className="text-muted-foreground block text-[10px]">Tier 1 (Year 1)</span>
            <span className="font-semibold text-foreground">120 Hours</span>
          </div>
          <div className="p-1.5 rounded-lg bg-muted/40">
            <span className="text-muted-foreground block text-[10px]">Tier 2 (Year 2)</span>
            <span className="font-semibold text-foreground">240 Hours</span>
          </div>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <span className="block text-[10px]">Final Status</span>
            <span className="font-bold">NSS Certificate</span>
          </div>
        </div>
      </div>

      {/* ── 5. Main Content Columns (2/3 Left, 1/3 Right) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Application Onboarding Journey Card */}
          {application ? (
            <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-foreground">
                      Enrollment & Application Status
                    </h2>
                    <p className="text-xs text-muted-foreground font-mono">
                      Form No: {application.formNo}
                    </p>
                  </div>
                </div>

                <div>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                      application.status === "approved"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : application.status === "rejected"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {application.status === "approved" && (
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    )}
                    {application.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Visual 4-Step Stepper */}
              <div className="grid grid-cols-4 gap-2 mb-5">
                {[
                  { label: "Submitted", done: true },
                  {
                    label: "Under Review",
                    done:
                      application.status === "under-review" || application.status === "approved",
                  },
                  { label: "Approved", done: application.status === "approved" },
                  {
                    label: "ID Card Issued",
                    done: application.status === "approved",
                  },
                ].map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center text-center">
                    <div
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        step.done
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step.done ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-foreground mt-1.5 line-clamp-1">
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Application Details Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-muted/30 rounded-xl p-3.5 border border-border/50 mb-4">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Full Name</span>
                  <span className="font-semibold text-foreground text-sm">
                    {application.nameEnglish}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">School / Institution</span>
                  <span className="font-semibold text-foreground text-sm truncate block">
                    {application.institutionName}
                  </span>
                </div>
              </div>

              {/* Action Buttons for Application */}
              <div className="flex flex-wrap items-center gap-2.5">
                {application.status === "approved" && (
                  <>
                    <a
                      href={`/api/generate-pdf?id=${application._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:bg-primary/90 shadow-xs transition-all active:scale-95"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Download Form PDF</span>
                    </a>
                    <Link
                      href="/dashboard/id-card"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted font-medium text-xs sm:text-sm text-foreground transition-all"
                    >
                      <CreditCard className="w-4 h-4 text-primary" />
                      <span>View ID Card</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-6 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-60" />
              <h3 className="font-bold text-base text-foreground mb-1">No Application Found</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Complete your online enrollment form to become an official NSS volunteer.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
              >
                Apply Now
              </Link>
            </div>
          )}

          {/* Upcoming Events Showcase */}
          <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Upcoming NSS Events & Activities
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Register and participate to earn verified service hours
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/events"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 shrink-0"
              >
                <span>All Events</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-muted/20 border border-border/40">
                <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p className="text-xs sm:text-sm text-muted-foreground">
                  No upcoming events scheduled right now. Check back soon!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {upcomingEvents.slice(0, 4).map((event) => {
                  const evDate = new Date(event.eventDate)
                  return (
                    <div
                      key={event._id}
                      onClick={() => router.push("/dashboard/events")}
                      className="group p-3.5 rounded-xl border border-border hover:border-primary/40 bg-card hover:bg-muted/30 transition-all cursor-pointer flex gap-3 items-start"
                    >
                      {/* Date Badge */}
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex flex-col items-center justify-center shrink-0 border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <span className="text-[10px] font-bold uppercase leading-none">
                          {evDate.toLocaleDateString("en-IN", { month: "short" })}
                        </span>
                        <span className="text-base font-extrabold leading-tight">
                          {evDate.getDate()}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                          {event.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                          <Clock className="w-3 h-3 shrink-0" />
                          <span>
                            {event.startTime
                              ? new Date(event.startTime).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Time TBA"}
                          </span>
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 truncate">
                            <MapPin className="w-3 h-3 shrink-0 text-muted-foreground" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Social Media & Engagement Hub */}
          <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    Social Media Engagement Hub
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Amplify NSS campaigns and earn +2 to +10 community points
                  </p>
                </div>
              </div>

              {totalPoints > 0 && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{totalPoints} Points</span>
                </div>
              )}
            </div>

            {socialPosts.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-xs">
                No active social challenges right now.
              </div>
            ) : (
              <div className="space-y-3">
                {socialPosts.slice(0, 1).map((post) => {
                  const platformIcons: any = {
                    facebook: Facebook,
                    instagram: Instagram,
                    twitter: Twitter,
                    linkedin: Linkedin,
                    youtube: Youtube,
                  }
                  const platformColors: any = {
                    facebook: "bg-blue-600 hover:bg-blue-700",
                    instagram:
                      "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
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
                  const availablePlatforms = Object.keys(platformLinks).filter(
                    (key) => platformLinks[key],
                  )
                  const likedPlatforms = post.likedPlatforms || []
                  const mainPlatforms = ["facebook", "instagram", "twitter", "linkedin"]
                  const availableMainPlatforms = mainPlatforms.filter((p) => platformLinks[p])
                  const allMainPlatformsLiked =
                    availableMainPlatforms.length > 0 &&
                    availableMainPlatforms.every((p) => likedPlatforms.includes(p))

                  return (
                    <div
                      key={post._id}
                      className="border border-border/70 rounded-xl p-4 bg-muted/20 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-foreground truncate">
                            {post.title}
                          </h4>
                          {post.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                              {post.description}
                            </p>
                          )}
                        </div>
                        {allMainPlatformsLiked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        ) : (
                          <span className="text-[11px] text-muted-foreground font-medium shrink-0">
                            {likedPlatforms.length}/{availableMainPlatforms.length} done
                          </span>
                        )}
                      </div>

                      {/* Platforms Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {availableMainPlatforms.map((platform) => {
                          const IconComp = platformIcons[platform] || Share2
                          const isLiked = likedPlatforms.includes(platform)
                          const isProcessing = viewingPost === `${post._id}-${platform}`

                          return (
                            <button
                              key={platform}
                              disabled={isProcessing}
                              onClick={async (e) => {
                                e.preventDefault()
                                if (!isProcessing) {
                                  setViewingPost(`${post._id}-${platform}`)
                                  try {
                                    const res = await fetch("/api/volunteer/social-posts", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        postId: post._id,
                                        platform,
                                        action: "like",
                                      }),
                                    })
                                    const data = await res.json()
                                    if (data.success) {
                                      window.open(platformLinks[platform], "_blank")
                                      if (!isLiked && data.pointsEarned > 0) {
                                        setSocialPosts((prev) =>
                                          prev.map((p) =>
                                            p._id === post._id
                                              ? {
                                                  ...p,
                                                  clickedPlatforms: [
                                                    ...(p.clickedPlatforms || []),
                                                    platform,
                                                  ],
                                                  likedPlatforms: [
                                                    ...(p.likedPlatforms || []),
                                                    platform,
                                                  ],
                                                }
                                              : p,
                                          ),
                                        )
                                        setTotalPoints(data.totalPoints)
                                        await fetchDashboardData()
                                      }
                                    }
                                  } catch (err) {
                                    console.error(err)
                                  } finally {
                                    setViewingPost(null)
                                  }
                                }
                              }}
                              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-white text-xs font-semibold shadow-xs transition-all active:scale-95 ${
                                platformColors[platform]
                              } ${isLiked ? "opacity-80" : "hover:shadow-md"}`}
                            >
                              {isProcessing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <>
                                  <IconComp className="w-3.5 h-3.5" />
                                  <span>{platformLabels[platform]}</span>
                                  {isLiked && <CheckCircle className="w-3 h-3 ml-0.5" />}
                                </>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-4 sm:space-y-6">
          {/* Active Project Card */}
          {selectedProject ? (
            <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600">
                    <FolderKanban className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">My NSS Project</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                  Enrolled
                </span>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-base text-foreground leading-snug">
                  {selectedProject.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-3">
                  {selectedProject.description}
                </p>

                {selectedProject.location && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{selectedProject.location}</span>
                  </div>
                )}
                {selectedProject.coordinator && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <User className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Coordinator: {selectedProject.coordinator}</span>
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    href="/dashboard/projects"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                  >
                    <span>View Project Details</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border p-5 shadow-xs text-center">
              <FolderKanban className="w-8 h-8 text-primary mx-auto mb-2 opacity-60" />
              <h4 className="font-bold text-sm text-foreground mb-1">Select NSS Project</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Choose a project to start logging service activities.
              </p>
              <Link
                href="/dashboard/projects"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
              >
                Choose Project
              </Link>
            </div>
          )}

          {/* Quick Shortcuts */}
          <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Quick Shortcuts
            </h3>
            <div className="space-y-2">
              <Link
                href="/dashboard/profile"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/60 transition-colors border border-border/40 text-xs font-medium"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  <span>My Profile Details</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>

              <Link
                href="/dashboard/meetings"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/60 transition-colors border border-border/40 text-xs font-medium"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>Meetings & Attendance</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>

              <Link
                href="/dashboard/grievances"
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-muted/60 transition-colors border border-border/40 text-xs font-medium"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>Help & Grievances</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              </Link>
            </div>
          </div>

          {/* Follow NSS Social Links */}
          <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs">
            <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3">
              Official Channels
            </h3>
            <OfficialNssLinks />
          </div>
        </div>
      </div>

      {/* ── Notifications Modal Overlay ── */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-base text-foreground">Announcements & Notices</h3>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1">
              {displayNotifications.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-8">
                  No notifications to display.
                </p>
              ) : (
                displayNotifications.map((n) => (
                  <div
                    key={n._id}
                    className={`p-3 rounded-xl border text-xs transition-colors ${
                      n.isRead
                        ? "bg-muted/30 border-border/40"
                        : "bg-primary/5 border-primary/20 font-medium"
                    }`}
                  >
                    <p className="font-bold text-foreground text-sm mb-1">{n.title}</p>
                    <p className="text-muted-foreground leading-relaxed">{n.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">
                      {new Date(n.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-border flex justify-end">
              <button
                onClick={() => setShowNotifications(false)}
                className="px-4 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Lightweight client component to render official NSS links
function OfficialNssLinks() {
  const [links, setLinks] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/social-links")
        const data = await res.json()
        if (data.success) setLinks(data.links)
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-xs text-muted-foreground">Loading...</div>
  if (!links) return <div className="text-xs text-muted-foreground">No links configured</div>

  const icons = [
    {
      key: "facebook",
      label: "Facebook",
      url: links.facebook,
      bg: "bg-blue-600",
      svg: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
          <path d="M22 12a10 10 0 10-11.5 9.9v-7h-2.7V12h2.7V9.7c0-2.7 1.6-4.2 4-4.2 1.2 0 2.5.2 2.5.2v2.7h-1.4c-1.4 0-1.9.9-1.9 1.8V12h3.2l-.5 2.9h-2.7v7A10 10 0 0022 12z" />
        </svg>
      ),
    },
    {
      key: "instagram",
      label: "Instagram",
      url: links.instagram,
      bg: "bg-gradient-to-tr from-yellow-500 via-pink-600 to-purple-700",
      svg: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
          <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H7zm5 3a5 5 0 110 10 5 5 0 010-10zm0 2.2a2.8 2.8 0 100 5.6 2.8 2.8 0 000-5.6zM18 6.5a1 1 0 110 2 1 1 0 010-2z" />
        </svg>
      ),
    },
    {
      key: "twitter",
      label: "Twitter/X",
      url: links.twitter,
      bg: "bg-black",
      svg: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
          <path d="M3 3l8.2 10.2L3.6 21h2.2l6.1-6.7 4.9 6.7H21l-8.7-11.9L20.3 3h-2.2l-5.5 6.1L8.1 3H3z" />
        </svg>
      ),
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      url: links.linkedin,
      bg: "bg-sky-700",
      svg: (
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
          <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8.98h5V24H0V8.98zM8.98 8.98h4.78v2.05h.07c.67-1.27 2.3-2.6 4.73-2.6 5.06 0 6 3.33 6 7.66V24h-5v-6.8c0-1.62-.03-3.7-2.25-3.7-2.25 0-2.6 1.76-2.6 3.58V24h-5V8.98z" />
        </svg>
      ),
    },
  ]

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {icons.map((i) => (
        <a
          key={i.key}
          href={i.url || "#"}
          target={i.url ? "_blank" : undefined}
          className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs border border-border ${i.bg} ${
            i.url
              ? "opacity-100 hover:scale-105 active:scale-95 transition-transform"
              : "opacity-40 cursor-not-allowed"
          }`}
          aria-label={i.label}
        >
          {i.svg}
        </a>
      ))}
    </div>
  )
}
