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
  TrendingUp,
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
    <div className="flex items-center gap-3 mb-5">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <h3 className="text-[15px] font-semibold tracking-tight" style={{ color: "#0f1f3d" }}>
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

      <div className="p-3 sm:p-6 space-y-5 sm:space-y-7 admin-fade-in">

        {/* ── Overview Statistics ─────────────────────────────────────────── */}
        <section>
          <SectionHeader
            icon={<BarChart3 className="w-3.5 h-3.5" />}
            title="Overview Statistics"
            iconBg="#dbeafe"
            iconColor="#1e40af"
          />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
          <SectionHeader
            icon={<AlertCircle className="w-3.5 h-3.5" />}
            title="Pending Actions"
            iconBg="#fef3c7"
            iconColor="#d97706"
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Application Reviews */}
            <Link
              href="/admin/applications"
              className="group flex items-center justify-between gap-4 rounded-2xl border p-5 transition-all duration-250 hover:-translate-y-0.5"
              style={{
                background: "#ffffff",
                borderColor: "#e8edf5",
                boxShadow: "0 2px 6px rgba(15,31,61,0.05)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#fbbf24"
                ;(e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(217,119,6,0.12)"
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#e8edf5"
                ;(e.currentTarget as HTMLElement).style.boxShadow = "0 2px 6px rgba(15,31,61,0.05)"
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#fef3c7" }}>
                  <FileText className="w-5 h-5" style={{ color: "#d97706" }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#0f1f3d" }}>Application Reviews</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                    {loading ? "Loading..." : `${stats?.pendingApprovals || 0} applications awaiting review`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!loading && (stats?.pendingApprovals || 0) > 0 && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "#fef3c7", color: "#b45309" }}>
                    {stats?.pendingApprovals}
                  </span>
                )}
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: "#94a3b8" }} />
              </div>
            </Link>

            {/* Attendance Verification */}
            <Link
              href="/admin/attendance"
              className="group flex items-center justify-between gap-4 rounded-2xl border p-5 transition-all duration-250 hover:-translate-y-0.5"
              style={{
                background: "#ffffff",
                borderColor: "#e8edf5",
                boxShadow: "0 2px 6px rgba(15,31,61,0.05)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#fda4af"
                ;(e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(225,29,72,0.1)"
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "#e8edf5"
                ;(e.currentTarget as HTMLElement).style.boxShadow = "0 2px 6px rgba(15,31,61,0.05)"
              }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#ffe4e6" }}>
                  <ClipboardList className="w-5 h-5" style={{ color: "#e11d48" }} />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#0f1f3d" }}>Attendance Verification</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                    {loading ? "Loading..." : `${stats?.pendingAttendance || 0} verifications pending`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {!loading && (stats?.pendingAttendance || 0) > 0 && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: "#ffe4e6", color: "#be123c" }}>
                    {stats?.pendingAttendance}
                  </span>
                )}
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" style={{ color: "#94a3b8" }} />
              </div>
            </Link>
          </div>
        </section>

        {/* ── Events Overview ─────────────────────────────────────────────── */}
        <section>
          <SectionHeader
            icon={<Calendar className="w-3.5 h-3.5" />}
            title="Events Overview"
            iconBg="#ede9fe"
            iconColor="#7c3aed"
          />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Upcoming Events */}
            <div className="admin-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#dbeafe" }}>
                    <CalendarCheck className="w-4 h-4" style={{ color: "#1e40af" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#0f1f3d" }}>Upcoming Events</p>
                    <p className="text-[11px]" style={{ color: "#94a3b8" }}>Next scheduled events</p>
                  </div>
                </div>
                <Link href="/admin/events" className="text-[11px] font-medium px-2 py-1 rounded-lg transition-colors hover:bg-blue-50" style={{ color: "#1e40af" }}>
                  View all
                </Link>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 admin-skeleton rounded-xl" />
                  ))}
                </div>
              ) : upcomingEvents.length > 0 ? (
                <div className="space-y-1.5">
                  {upcomingEvents.map((event) => (
                    <div key={event._id} className="admin-event-row">
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="text-sm font-medium truncate" style={{ color: "#1e293b" }}>{event.title}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>
                          {formatDate(event.eventDate)}{event.location ? ` · ${event.location}` : ""}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex-shrink-0" style={{ background: "#dbeafe", color: "#1e40af" }}>
                        {event.registrations}{event.maxParticipants ? `/${event.maxParticipants}` : ""} reg.
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: "#f0f4f8" }}>
                    <CalendarCheck className="w-5 h-5" style={{ color: "#94a3b8" }} />
                  </div>
                  <p className="text-sm" style={{ color: "#64748b" }}>No upcoming events</p>
                </div>
              )}
            </div>

            {/* Completed Events */}
            <div className="admin-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#d1fae5" }}>
                    <CheckCircle2 className="w-4 h-4" style={{ color: "#059669" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "#0f1f3d" }}>Recently Completed</p>
                    <p className="text-[11px]" style={{ color: "#94a3b8" }}>Participation summary</p>
                  </div>
                </div>
                <Link href="/admin/events" className="text-[11px] font-medium px-2 py-1 rounded-lg transition-colors hover:bg-emerald-50" style={{ color: "#059669" }}>
                  View all
                </Link>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-12 admin-skeleton rounded-xl" />
                  ))}
                </div>
              ) : completedEvents.length > 0 ? (
                <div className="space-y-1.5">
                  {completedEvents.map((event) => (
                    <div key={event._id} className="admin-event-row">
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="text-sm font-medium truncate" style={{ color: "#1e293b" }}>{event.title}</p>
                        <p className="text-[11px] mt-0.5" style={{ color: "#94a3b8" }}>{formatDate(event.eventDate)}</p>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex-shrink-0" style={{ background: "#d1fae5", color: "#059669" }}>
                        {event.participation} participated
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-2" style={{ background: "#f0f4f8" }}>
                    <CheckCircle2 className="w-5 h-5" style={{ color: "#94a3b8" }} />
                  </div>
                  <p className="text-sm" style={{ color: "#64748b" }}>No completed events yet</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Meetings Overview + Attendance ──────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Meetings */}
          <div className="admin-card">
            <SectionHeader
              icon={<Calendar className="w-3.5 h-3.5" />}
              title="Meetings Overview"
              iconBg="#fef3c7"
              iconColor="#d97706"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total", value: meetings.total, bg: "#f8fafc", text: "#1e293b" },
                { label: "Upcoming", value: meetings.upcomingOrOngoing, bg: "#dbeafe", text: "#1e40af" },
                { label: "Completed", value: meetings.completed, bg: "#d1fae5", text: "#059669" },
                { label: "Cancelled", value: meetings.cancelled, bg: "#ffe4e6", text: "#e11d48" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: item.bg }}>
                  <p className="text-[11px] font-medium mb-1" style={{ color: "#94a3b8" }}>{item.label}</p>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: item.text }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Meeting Attendance */}
          <div className="admin-card">
            <SectionHeader
              icon={<UserCheck className="w-3.5 h-3.5" />}
              title="Meeting Attendance"
              iconBg="#cffafe"
              iconColor="#0891b2"
            />
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Registrations", value: meetingAttendance.totalRegistrations, bg: "#f8fafc", text: "#1e293b" },
                { label: "Attended", value: meetingAttendance.attended, bg: "#d1fae5", text: "#059669" },
                { label: "Absent", value: meetingAttendance.absent, bg: "#ffe4e6", text: "#e11d48" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl p-3 text-center" style={{ background: item.bg }}>
                  <p className="text-[11px] font-medium mb-1" style={{ color: "#94a3b8" }}>{item.label}</p>
                <p className="text-xl sm:text-2xl font-bold" style={{ color: item.text }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Reports & Recent Activity ───────────────────────────────────── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Reports link */}
          <Link
            href="/admin/reports"
            className="admin-card admin-card-hover group block"
            style={{ textDecoration: "none" }}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
                style={{ background: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)", boxShadow: "0 4px 12px rgba(30,64,175,0.25)" }}
              >
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold transition-colors duration-150 group-hover:text-blue-700" style={{ color: "#0f1f3d" }}>
                  Reports & Analytics
                </h3>
                <p className="text-sm mt-1" style={{ color: "#64748b" }}>Monthly events, attendance trends & volunteer stats</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold" style={{ color: "#1e40af" }}>
                  View reports
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </div>
              </div>
            </div>
          </Link>

          {/* Recent Activity */}
          <div className="admin-card">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "#cffafe" }}>
                <Activity className="w-6 h-6" style={{ color: "#0891b2" }} />
              </div>
              <div>
                <h3 className="text-base font-semibold" style={{ color: "#0f1f3d" }}>System Summary</h3>
                <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>Live application & event metrics</p>
              </div>
            </div>
            <div className="space-y-2">
              {[
                {
                  dot: "#16a34a",
                  label: "Applications",
                  value: `${legacyStats.approved} approved · ${legacyStats.pendingReview} pending · ${legacyStats.rejected} rejected`,
                },
                {
                  dot: "#1e40af",
                  label: "Events",
                  value: `${stats?.upcomingEvents || 0} upcoming · ${stats?.completedEvents || 0} completed`,
                },
                {
                  dot: "#d97706",
                  label: "Meetings",
                  value: `${meetings.total} total · ${meetings.upcomingOrOngoing} upcoming`,
                },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3 px-3 py-2.5 rounded-xl" style={{ background: "#f8fafc" }}>
                  <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: item.dot }} />
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#334155" }}>{item.label}</p>
                    <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Quick Actions ────────────────────────────────────────────────── */}
        <section>
          <SectionHeader
            icon={<Eye className="w-3.5 h-3.5" />}
            title="Quick Actions"
            iconBg="#f3e8ff"
            iconColor="#9333ea"
          />
          <div className="admin-card">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  href: "/admin/applications",
                  bg: "#dbeafe",
                  icon: <FileText className="w-5 h-5" style={{ color: "#1e40af" }} />,
                  label: "Review Applications",
                  sub: `${legacyStats.pendingReview} pending`,
                },
                {
                  href: "/admin/users",
                  bg: "#cffafe",
                  icon: <Users className="w-5 h-5" style={{ color: "#0891b2" }} />,
                  label: "Manage Users",
                  sub: "Admin & sub-admin accounts",
                },
                {
                  href: "/admin/volunteers",
                  bg: "#d1fae5",
                  icon: <UserCheck className="w-5 h-5" style={{ color: "#059669" }} />,
                  label: "Manage Volunteers",
                  sub: `${stats?.totalVolunteers || 0} active volunteers`,
                },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-center gap-3.5 p-4 rounded-xl border border-transparent transition-all duration-200"
                  style={{ background: "#f8fafc" }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = action.bg
                    ;(e.currentTarget as HTMLElement).style.borderColor = action.bg
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLElement).style.background = "#f8fafc"
                    ;(e.currentTarget as HTMLElement).style.borderColor = "transparent"
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105" style={{ background: action.bg }}>
                    {action.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "#0f1f3d" }}>{action.label}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "#64748b" }}>{action.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── NSS Social Media ─────────────────────────────────────────────── */}
        <section>
          <div className="admin-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-semibold" style={{ color: "#0f1f3d" }}>NSS Social Media</h3>
              <Link
                href="/admin/social-links"
                className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-150 hover:bg-blue-50"
                style={{ color: "#1e40af", borderColor: "#bfdbfe" }}
              >
                Edit Links
              </Link>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
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
                  <Link href="/admin/social-links" style={{ color: "#1e40af" }} className="hover:underline">Add links →</Link>
                </p>
              )}
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
