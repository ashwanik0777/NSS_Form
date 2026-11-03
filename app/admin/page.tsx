"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import AdminHeader from "@/components/admin/AdminHeader"
import {
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  ChevronRight,
  BarChart3,
  Activity,
  AlertCircle,
  CalendarCheck,
  UserCheck,
  ClipboardList,
  Eye,
  Loader2,
  ArrowRight,
  Share2,
} from "lucide-react"

interface DashboardStats {
  totalVolunteers: number
  totalEvents: number
  upcomingEvents: number
  completedEvents: number
  totalApplications: number
  pendingApprovals: number
  totalParticipations: number
  pendingAttendance: number
}

interface UpcomingEvent {
  _id: string
  title: string
  eventDate: string
  registrations: number
  maxParticipants?: number
  location?: string
}

interface CompletedEvent {
  _id: string
  title: string
  eventDate: string
  participation: number
  registrations?: number
  approvedAttendance?: number
  pendingAttendance?: number
}

// ── Stat Card Component ──────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon,
  accent,
  loading,
}: {
  title: string
  value: number | string
  icon: React.ReactNode
  accent: { bg: string; icon: string; text: string }
  loading: boolean
}) {
  return (
    <div className="admin-stat-card group cursor-default">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#94a3b8" }}>
            {title}
          </p>
          {loading ? (
            <div className="h-7 w-12 admin-skeleton rounded-md" />
          ) : (
            <p className="text-2xl sm:text-3xl font-bold leading-none" style={{ color: "#0f1f3d" }}>
              {value}
            </p>
          )}
        </div>
        <div
          className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
          style={{ background: accent.bg }}
        >
          <span className="scale-90 sm:scale-100" style={{ color: accent.icon }}>{icon}</span>
        </div>
      </div>
    </div>
  )
}

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({
  icon,
  title,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode
  title: string
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="flex items-center gap-2.5 mb-2 sm:mb-2.5">
      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <h3 className="text-sm sm:text-[15px] font-semibold tracking-tight" style={{ color: "#0f1f3d" }}>
        {title}
      </h3>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])
  const [completedEvents, setCompletedEvents] = useState<CompletedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [social, setSocial] = useState<{ facebook?: string; instagram?: string; twitter?: string; linkedin?: string }>({})

  // Legacy stats for backward compat (applications stats)
  const [legacyStats, setLegacyStats] = useState({
    totalApplications: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
  })

  const [meetings, setMeetings] = useState<{ total: number; upcomingOrOngoing: number; completed: number; cancelled: number }>({
    total: 0,
    upcomingOrOngoing: 0,
    completed: 0,
    cancelled: 0,
  })
  const [meetingAttendance, setMeetingAttendance] = useState<{ totalRegistrations: number; attended: number; absent: number }>({
    totalRegistrations: 0,
    attended: 0,
    absent: 0,
  })

  useEffect(() => {
    fetchDashboardStats()
    fetchLegacyStats()
    fetchSocial()
    fetchMeetingStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch("/api/admin/dashboard-stats")
      const data = await res.json()
      if (data.success) {
        setStats(data.stats)
        setUpcomingEvents(data.recentUpcomingEvents || [])
        setCompletedEvents(data.recentCompletedEvents || [])
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLegacyStats = async () => {
    try {
      const [total, pending, approved, rejected] = await Promise.all([
        fetch("/api/applications?status=all"),
        fetch("/api/applications?status=submitted"),
        fetch("/api/applications?status=approved"),
        fetch("/api/applications?status=rejected"),
      ])
      const [totalData, pendingData, approvedData, rejectedData] = await Promise.all([
        total.json(),
        pending.json(),
        approved.json(),
        rejected.json(),
      ])
      setLegacyStats({
        totalApplications: totalData.pagination?.total || 0,
        pendingReview: pendingData.pagination?.total || 0,
        approved: approvedData.pagination?.total || 0,
        rejected: rejectedData.pagination?.total || 0,
      })
    } catch (error) {
      console.error("Error fetching legacy stats:", error)
    }
  }

  const fetchSocial = async () => {
    try {
      const res = await fetch("/api/admin/social-links")
      const data = await res.json()
      if (data.success) {
        setSocial({
          facebook: data.links?.facebook || "",
          instagram: data.links?.instagram || "",
          twitter: data.links?.twitter || "",
          linkedin: data.links?.linkedin || "",
        })
      }
    } catch (e) {}
  }

  const fetchMeetingStats = async () => {
    try {
      const res = await fetch("/api/admin/meetings/stats")
      const data = await res.json()
      if (data.success) {
        setMeetings(data.meetings || { total: 0, upcomingOrOngoing: 0, completed: 0, cancelled: 0 })
        setMeetingAttendance(data.attendance || { totalRegistrations: 0, attended: 0, absent: 0 })
      }
    } catch (e) {}
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    } catch {
      return "—"
    }
  }

  const overviewCards = [
    {
      title: "Total Volunteers",
      value: stats?.totalVolunteers ?? 0,
      icon: <Users className="w-5 h-5" />,
      accent: { bg: "#dbeafe", icon: "#1e40af", text: "#1e40af" },
    },
    {
      title: "Total Events",
      value: stats?.totalEvents ?? 0,
      icon: <Calendar className="w-5 h-5" />,
      accent: { bg: "#ede9fe", icon: "#7c3aed", text: "#7c3aed" },
    },
    {
      title: "Upcoming Events",
      value: stats?.upcomingEvents ?? 0,
      icon: <CalendarCheck className="w-5 h-5" />,
      accent: { bg: "#d1fae5", icon: "#059669", text: "#059669" },
    },
    {
      title: "Completed Events",
      value: stats?.completedEvents ?? 0,
      icon: <CheckCircle2 className="w-5 h-5" />,
      accent: { bg: "#dcfce7", icon: "#16a34a", text: "#16a34a" },
    },
    {
      title: "Total Applications",
      value: stats?.totalApplications ?? 0,
      icon: <FileText className="w-5 h-5" />,
      accent: { bg: "#f3e8ff", icon: "#9333ea", text: "#9333ea" },
    },
    {
      title: "Pending Approvals",
      value: stats?.pendingApprovals ?? 0,
      icon: <Clock className="w-5 h-5" />,
      accent: { bg: "#fef3c7", icon: "#d97706", text: "#d97706" },
    },
    {
      title: "Total Participation",
      value: stats?.totalParticipations ?? 0,
      icon: <UserCheck className="w-5 h-5" />,
      accent: { bg: "#cffafe", icon: "#0891b2", text: "#0891b2" },
    },
    {
      title: "Pending Attendance",
      value: stats?.pendingAttendance ?? 0,
      icon: <ClipboardList className="w-5 h-5" />,
      accent: { bg: "#ffe4e6", icon: "#e11d48", text: "#e11d48" },
    },
  ]

  return (
    <>
      <AdminHeader title="Dashboard" subtitle="NSS Application & Activity Management" />

      <div className="p-3 sm:p-5 space-y-3.5 sm:space-y-4.5 admin-fade-in">

        {/* ── Overview Statistics ─────────────────────────────────────────── */}
        <section>
          <SectionHeader
            icon={<BarChart3 className="w-3.5 h-3.5" />}
            title="Overview Statistics"
            iconBg="#dbeafe"
            iconColor="#1e40af"
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            {overviewCards.map((card, index) => (
              <StatCard
                key={index}
                title={card.title}
                value={card.value}
                icon={card.icon}
                accent={card.accent}
                loading={loading}
              />
            ))}
          </div>
        </section>

        {/* ── Pending Actions ─────────────────────────────────────────────── */}
        <section>
          <div className="admin-card !p-3.5 sm:!p-4">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "#fef3c7" }}>
                  <AlertCircle className="w-3 h-3" style={{ color: "#d97706" }} />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold tracking-tight text-slate-800">
                  Pending Actions
                </h3>
                <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">· Immediate review required</span>
              </div>
              {!loading && ((stats?.pendingApprovals || 0) + (stats?.pendingAttendance || 0)) > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: "#fef3c7", color: "#b45309" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {((stats?.pendingApprovals || 0) + (stats?.pendingAttendance || 0))} pending
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5">
              {/* Application Reviews */}
              <Link
                href="/admin/applications"
                className="group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-slate-200/70 bg-slate-50/50 hover:bg-amber-50/60 hover:border-amber-300 transition-all duration-150"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                    style={{ background: "#fef3c7" }}
                  >
                    <FileText className="w-4 h-4" style={{ color: "#d97706" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-amber-950 transition-colors">
                      Application Reviews
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {loading ? "Loading..." : `${stats?.pendingApprovals || 0} applications awaiting review`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!loading && (stats?.pendingApprovals || 0) > 0 ? (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: "#fef3c7", color: "#b45309" }}
                    >
                      {stats?.pendingApprovals}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium text-slate-400 bg-white border border-slate-200">
                      0
                    </span>
                  )}
                  <ArrowRight
                    className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    style={{ color: "#94a3b8" }}
                  />
                </div>
              </Link>

              {/* Attendance Verification */}
              <Link
                href="/admin/attendance"
                className="group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-slate-200/70 bg-slate-50/50 hover:bg-rose-50/60 hover:border-rose-300 transition-all duration-150"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                    style={{ background: "#ffe4e6" }}
                  >
                    <ClipboardList className="w-4 h-4" style={{ color: "#e11d48" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-rose-950 transition-colors">
                      Attendance Verification
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                      {loading ? "Loading..." : `${stats?.pendingAttendance || 0} verifications pending`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!loading && (stats?.pendingAttendance || 0) > 0 ? (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: "#ffe4e6", color: "#be123c" }}
                    >
                      {stats?.pendingAttendance}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium text-slate-400 bg-white border border-slate-200">
                      0
                    </span>
                  )}
                  <ArrowRight
                    className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                    style={{ color: "#94a3b8" }}
                  />
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Events Overview ─────────────────────────────────────────────── */}
        <section>
          <div className="admin-card !p-3.5 sm:!p-4">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "#ede9fe" }}>
                  <Calendar className="w-3 h-3" style={{ color: "#7c3aed" }} />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold tracking-tight text-slate-800">
                  Events Overview
                </h3>
                <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">· Scheduled & completed events</span>
              </div>
              <Link
                href="/admin/events"
                className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                All Events
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3.5">
              {/* Upcoming Events Column */}
              <div className="p-3 rounded-xl border border-slate-200/70 bg-slate-50/40 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200/50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "#dbeafe" }}>
                      <CalendarCheck className="w-3 h-3" style={{ color: "#1e40af" }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-800">Upcoming Events</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Next scheduled</span>
                </div>

                {loading ? (
                  <div className="space-y-1.5 py-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-9 admin-skeleton rounded-lg" />
                    ))}
                  </div>
                ) : upcomingEvents.length > 0 ? (
                  <div className="space-y-1.5">
                    {upcomingEvents.map((event) => (
                      <Link
                        key={event._id}
                        href="/admin/events"
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/60 hover:border-blue-300 hover:bg-blue-50/30 transition-all text-xs"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-medium text-slate-800 truncate">{event.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {formatDate(event.eventDate)}{event.location ? ` · ${event.location}` : ""}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0" style={{ background: "#dbeafe", color: "#1e40af" }}>
                          {event.registrations}{event.maxParticipants ? `/${event.maxParticipants}` : ""} reg.
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-5 text-center">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-1 bg-slate-100">
                      <CalendarCheck className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-500">No upcoming events scheduled</p>
                  </div>
                )}
              </div>

              {/* Completed Events Column */}
              <div className="p-3 rounded-xl border border-slate-200/70 bg-slate-50/40 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-200/50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: "#d1fae5" }}>
                      <CheckCircle2 className="w-3 h-3" style={{ color: "#059669" }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-800">Recently Completed</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Turnout records</span>
                </div>

                {loading ? (
                  <div className="space-y-1.5 py-1">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-9 admin-skeleton rounded-lg" />
                    ))}
                  </div>
                ) : completedEvents.length > 0 ? (
                  <div className="space-y-1.5">
                    {completedEvents.map((event) => (
                      <Link
                        key={event._id}
                        href="/admin/events"
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white border border-slate-200/60 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all text-xs"
                      >
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="font-medium text-slate-800 truncate">{event.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                            {formatDate(event.eventDate)}
                            {typeof event.registrations === "number" && event.registrations > 0
                              ? ` · ${event.registrations} registered`
                              : ""}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0" style={{ background: "#d1fae5", color: "#059669" }}>
                          {event.participation} participated
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-5 text-center">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-1 bg-slate-100">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <p className="text-xs text-slate-500">No completed events yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Meetings & Attendance ───────────────────────────────────────── */}
        <section>
          <div className="admin-card !p-3.5 sm:!p-4">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "#cffafe" }}>
                  <UserCheck className="w-3 h-3" style={{ color: "#0891b2" }} />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold tracking-tight text-slate-800">
                  Meetings & Attendance
                </h3>
                <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">· Session status & turnout</span>
              </div>
              <Link
                href="/admin/meetings"
                className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                All Meetings
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3.5">
              {/* Meetings Status */}
              <div className="p-3 rounded-xl border border-slate-200/70 bg-slate-50/40">
                <p className="text-xs font-semibold text-slate-700 mb-2">Meetings Status</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: "Total", value: meetings.total, bg: "#ffffff", text: "#1e293b", border: "#e2e8f0" },
                    { label: "Upcoming", value: meetings.upcomingOrOngoing, bg: "#eff6ff", text: "#1e40af", border: "#bfdbfe" },
                    { label: "Completed", value: meetings.completed, bg: "#f0fdf4", text: "#059669", border: "#bbf7d0" },
                    { label: "Cancelled", value: meetings.cancelled, bg: "#fff1f2", text: "#e11d48", border: "#fecdd3" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg p-2 text-center border"
                      style={{ background: item.bg, borderColor: item.border }}
                    >
                      <p className="text-[10px] font-medium text-slate-500 mb-0.5">{item.label}</p>
                      <p className="text-base sm:text-lg font-bold" style={{ color: item.text }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attendance Breakdown */}
              <div className="p-3 rounded-xl border border-slate-200/70 bg-slate-50/40">
                <p className="text-xs font-semibold text-slate-700 mb-2">Turnout Summary</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "Registrations", value: meetingAttendance.totalRegistrations, bg: "#ffffff", text: "#1e293b", border: "#e2e8f0" },
                    { label: "Attended", value: meetingAttendance.attended, bg: "#f0fdf4", text: "#059669", border: "#bbf7d0" },
                    { label: "Absent", value: meetingAttendance.absent, bg: "#fff1f2", text: "#e11d48", border: "#fecdd3" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-lg p-2 text-center border"
                      style={{ background: item.bg, borderColor: item.border }}
                    >
                      <p className="text-[10px] font-medium text-slate-500 mb-0.5">{item.label}</p>
                      <p className="text-base sm:text-lg font-bold" style={{ color: item.text }}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Quick Actions ────────────────────────────────────────────────── */}
        <section>
          <div className="admin-card !p-3.5 sm:!p-4">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "#f3e8ff" }}>
                  <Eye className="w-3 h-3" style={{ color: "#9333ea" }} />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold tracking-tight text-slate-800">
                  Quick Actions
                </h3>
                <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">· Frequent admin shortcuts</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {[
                {
                  href: "/admin/applications",
                  bg: "#dbeafe",
                  icon: <FileText className="w-4 h-4" style={{ color: "#1e40af" }} />,
                  label: "Review Applications",
                  sub: `${legacyStats.pendingReview} pending`,
                },
                {
                  href: "/admin/users",
                  bg: "#cffafe",
                  icon: <Users className="w-4 h-4" style={{ color: "#0891b2" }} />,
                  label: "Manage Users",
                  sub: "Admin accounts",
                },
                {
                  href: "/admin/volunteers",
                  bg: "#d1fae5",
                  icon: <UserCheck className="w-4 h-4" style={{ color: "#059669" }} />,
                  label: "Manage Volunteers",
                  sub: `${stats?.totalVolunteers || 0} active`,
                },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-center gap-2.5 px-3 py-2 rounded-lg border border-slate-200/70 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all duration-150"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105" style={{ background: action.bg }}>
                    {action.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-primary transition-colors">{action.label}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{action.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── NSS Social Media ─────────────────────────────────────────────── */}
        <section>
          <div className="admin-card !p-3.5 sm:!p-4">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "#dbeafe" }}>
                  <Share2 className="w-3 h-3" style={{ color: "#1e40af" }} />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold tracking-tight text-slate-800">
                  NSS Social Media
                </h3>
                <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">· Official public channels</span>
              </div>
              <Link
                href="/admin/social-links"
                className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              >
                Edit Links
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap pt-1">
              {[
                {
                  key: "facebook",
                  url: social.facebook,
                  bg: "#1877f2",
                  label: "Facebook",
                  svg: (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                      <path d="M22 12a10 10 0 10-11.5 9.9v-7h-2.7V12h2.7V9.7c0-2.7 1.6-4.2 4-4.2 1.2 0 2.5.2 2.5.2v2.7h-1.4c-1.4 0-1.9.9-1.9 1.8V12h3.2l-.5 2.9h-2.7v7A10 10 0 0022 12z" />
                    </svg>
                  ),
                },
                {
                  key: "instagram",
                  url: social.instagram,
                  bg: "linear-gradient(135deg, #f9a825, #e91e8c, #9c27b0)",
                  label: "Instagram",
                  svg: (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                      <path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H7zm5 3a5 5 0 110 10 5 5 0 010-10zm0 2.2a2.8 2.8 0 100 5.6 2.8 2.8 0 000-5.6zM18 6.5a1 1 0 110 2 1 1 0 010-2z" />
                    </svg>
                  ),
                },
                {
                  key: "twitter",
                  url: social.twitter,
                  bg: "#000000",
                  label: "X (Twitter)",
                  svg: (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                      <path d="M3 3l8.2 10.2L3.6 21h2.2l6.1-6.7 4.9 6.7H21l-8.7-11.9L20.3 3h-2.2l-5.5 6.1L8.1 3H3z" />
                    </svg>
                  ),
                },
                {
                  key: "linkedin",
                  url: social.linkedin,
                  bg: "#0077b5",
                  label: "LinkedIn",
                  svg: (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
                      <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8.98h5V24H0V8.98zM8.98 8.98h4.78v2.05h.07c.67-1.27 2.3-2.6 4.73-2.6 5.06 0 6 3.33 6 7.66V24h-5v-6.8c0-1.62-.03-3.7-2.25-3.7-2.25 0-2.6 1.76-2.6 3.58V24h-5V8.98z" />
                    </svg>
                  ),
                },
              ].map((item) => (
                <a
                  key={item.key}
                  href={item.url || "#"}
                  target={item.url ? "_blank" : undefined}
                  rel={item.url ? "noopener noreferrer" : undefined}
                  title={item.label}
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: item.bg,
                    opacity: item.url ? 1 : 0.35,
                    cursor: item.url ? "pointer" : "not-allowed",
                    boxShadow: item.url ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                  }}
                  onClick={!item.url ? (e) => e.preventDefault() : undefined}
                  onMouseEnter={(e) => { if (item.url) (e.currentTarget as HTMLElement).style.transform = "translateY(-2px) scale(1.05)" }}
                  onMouseLeave={(e) => { if (item.url) (e.currentTarget as HTMLElement).style.transform = "none" }}
                >
                  {item.svg}
                </a>
              ))}
              {!social.facebook && !social.instagram && !social.twitter && !social.linkedin && (
                <p className="text-sm ml-1" style={{ color: "#94a3b8" }}>
                  No social links configured yet.{" "}
                  <Link href="/admin/social-links" style={{ color: "#1e40af" }} className="hover:underline inline-flex items-center">
                    Add links <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                </p>
              )}
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
