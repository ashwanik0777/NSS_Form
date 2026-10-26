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

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([])
  const [completedEvents, setCompletedEvents] = useState<CompletedEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [social, setSocial] = useState<{facebook?: string; instagram?: string; twitter?: string; linkedin?: string}>({})

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
      const res = await fetch('/api/admin/social-links')
      const data = await res.json()
      if (data.success) {
        setSocial({
          facebook: data.links?.facebook || '',
          instagram: data.links?.instagram || '',
          twitter: data.links?.twitter || '',
          linkedin: data.links?.linkedin || '',
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
      value: stats?.totalVolunteers ?? "—",
      icon: <Users className="w-6 h-6" />,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
    },
    {
      title: "Total Events Till Date",
      value: stats?.totalEvents ?? "—",
      icon: <Calendar className="w-6 h-6" />,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-950/30",
      border: "border-indigo-200 dark:border-indigo-800",
    },
    {
      title: "Upcoming Events",
      value: stats?.upcomingEvents ?? "—",
      icon: <CalendarCheck className="w-6 h-6" />,
      color: "text-emerald-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-800",
    },
    {
      title: "Completed Events",
      value: stats?.completedEvents ?? "—",
      icon: <CheckCircle2 className="w-6 h-6" />,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-200 dark:border-green-800",
    },
    {
      title: "Total Applications",
      value: stats?.totalApplications ?? "—",
      icon: <FileText className="w-6 h-6" />,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950/30",
      border: "border-purple-200 dark:border-purple-800",
    },
    {
      title: "Pending Approvals",
      value: stats?.pendingApprovals ?? "—",
      icon: <Clock className="w-6 h-6" />,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800",
    },
    {
      title: "Total Participation",
      value: stats?.totalParticipations ?? "—",
      icon: <UserCheck className="w-6 h-6" />,
      color: "text-cyan-600",
      bg: "bg-cyan-50 dark:bg-cyan-950/30",
      border: "border-cyan-200 dark:border-cyan-800",
    },
    {
      title: "Pending Attendance",
      value: stats?.pendingAttendance ?? "—",
      icon: <ClipboardList className="w-6 h-6" />,
      color: "text-rose-600",
      bg: "bg-rose-50 dark:bg-rose-950/30",
      border: "border-rose-200 dark:border-rose-800",
    },
  ]

  return (
    <>
      <AdminHeader title="Dashboard" subtitle="NSS Application & Activity Management" />

      <div className="p-6 space-y-6">

        {/* Overview Statistics */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Overview Statistics
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {overviewCards.map((card, index) => (
              <div
                key={index}
                className={`bg-card rounded-xl border ${card.border} p-5 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{card.title}</p>
                    <p className="text-3xl font-bold text-foreground">
                      {loading ? (
                        <span className="inline-block w-8 h-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></span>
                      ) : card.value}
                    </p>
                  </div>
                  <div className={`p-2.5 rounded-xl ${card.bg}`}>
                    <span className={card.color}>{card.icon}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Actions */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Pending Actions
          </h3>
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            <Link
              href="/admin/applications"
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group first:rounded-t-xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Application Reviews</p>
                  <p className="text-sm text-muted-foreground">
                    {loading ? "Loading..." : `${stats?.pendingApprovals || 0} pending applications`}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
            <Link
              href="/admin/attendance"
              className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors group last:rounded-b-xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Attendance Verification</p>
                  <p className="text-sm text-muted-foreground">
                    {loading ? "Loading..." : `${stats?.pendingAttendance || 0} pending verifications`}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </div>
        </div>

        {/* Events Overview */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-pink-500" />
            Events Overview
          </h3>
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {/* Upcoming Events */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Upcoming Events</p>
                  <p className="text-xs text-muted-foreground">Event name • Date • Registrations</p>
                </div>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : upcomingEvents.length > 0 ? (
                <div className="space-y-2 ml-11">
                  {upcomingEvents.map((event) => (
                    <div key={event._id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(event.eventDate)}{event.location ? ` • ${event.location}` : ""}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-medium ml-2 whitespace-nowrap">
                        {event.registrations}{event.maxParticipants ? `/${event.maxParticipants}` : ""} registered
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground ml-11">No upcoming events</p>
              )}
            </div>

            {/* Recent Completed Events */}
            <div className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Recent Completed Events</p>
                  <p className="text-xs text-muted-foreground">Event name • Participation</p>
                </div>
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : completedEvents.length > 0 ? (
                <div className="space-y-2 ml-11">
                  {completedEvents.map((event) => (
                    <div key={event._id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(event.eventDate)}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400 font-medium ml-2 whitespace-nowrap">
                        {event.participation} participated
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground ml-11">No completed events yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Meetings Overview + Meeting Attendance (existing) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Meetings Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-muted/40 border border-border/50 rounded-lg p-4">
                <p className="text-muted-foreground text-xs mb-1">Total</p>
                <p className="text-xl font-bold">{meetings.total}</p>
              </div>
              <div className="bg-muted/40 border border-border/50 rounded-lg p-4">
                <p className="text-muted-foreground text-xs mb-1 break-words">Upcoming/Ongoing</p>
                <p className="text-xl font-bold">{meetings.upcomingOrOngoing}</p>
              </div>
              <div className="bg-muted/40 border border-border/50 rounded-lg p-4">
                <p className="text-muted-foreground text-xs mb-1">Completed</p>
                <p className="text-xl font-bold">{meetings.completed}</p>
              </div>
              <div className="bg-muted/40 border border-border/50 rounded-lg p-4">
                <p className="text-muted-foreground text-xs mb-1">Cancelled</p>
                <p className="text-xl font-bold">{meetings.cancelled}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal-500" />
              Meeting Attendance
            </h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-muted/40 border border-border/50 rounded-lg p-4">
                <p className="text-muted-foreground text-xs mb-1">Registrations</p>
                <p className="text-xl font-bold">{meetingAttendance.totalRegistrations}</p>
              </div>
              <div className="bg-muted/40 border border-border/50 rounded-lg p-4">
                <p className="text-muted-foreground text-xs mb-1">Attended</p>
                <p className="text-xl font-bold">{meetingAttendance.attended}</p>
              </div>
              <div className="bg-muted/40 border border-border/50 rounded-lg p-4">
                <p className="text-muted-foreground text-xs mb-1">Absent</p>
                <p className="text-xl font-bold">{meetingAttendance.absent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reports & Analytics + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Link
            href="/admin/reports"
            className="bg-card rounded-xl border border-border p-6 hover:shadow-md hover:border-primary/30 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">Reports & Analytics</h3>
                <p className="text-sm text-muted-foreground mt-1">Monthly events, attendance trends</p>
              </div>
            </div>
          </Link>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center">
                <Activity className="w-6 h-6 text-sky-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                <p className="text-sm text-muted-foreground mt-1">Admin actions and updates</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-muted/25 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">System Active</p>
                  <p className="text-xs text-muted-foreground">
                    {legacyStats.approved} approved • {legacyStats.pendingReview} pending • {legacyStats.rejected} rejected
                  </p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-muted/25 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Events Summary</p>
                  <p className="text-xs text-muted-foreground">
                    {stats?.upcomingEvents || 0} upcoming • {stats?.completedEvents || 0} completed
                  </p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-muted/25 rounded-lg">
                <div className="w-2 h-2 bg-amber-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Meetings</p>
                  <p className="text-xs text-muted-foreground">
                    {meetings.total} total • {meetings.upcomingOrOngoing} upcoming
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions (kept from original) */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-500" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link
              href="/admin/applications"
              className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl hover:bg-muted/60 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Review Applications</p>
                <p className="text-xs text-muted-foreground">{legacyStats.pendingReview} pending</p>
              </div>
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl hover:bg-muted/60 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Manage Users</p>
                <p className="text-xs text-muted-foreground">Admin & sub-admin accounts</p>
              </div>
            </Link>
            <Link
              href="/admin/volunteers"
              className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl hover:bg-muted/60 transition-colors group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Manage Volunteers</p>
                <p className="text-xs text-muted-foreground">{stats?.totalVolunteers || 0} active volunteers</p>
              </div>
            </Link>
          </div>
        </div>

        {/* NSS Social Media (kept from original) */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">NSS Social Media</h3>
            <Link href="/admin/social-links" className="text-sm text-primary hover:underline">Edit Links</Link>
          </div>
          <div className="flex items-center gap-4">
            {[
              { key: 'facebook', url: social.facebook, bg: 'bg-blue-600', svg: (
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M22 12a10 10 0 10-11.5 9.9v-7h-2.7V12h2.7V9.7c0-2.7 1.6-4.2 4-4.2 1.2 0 2.5.2 2.5.2v2.7h-1.4c-1.4 0-1.9.9-1.9 1.8V12h3.2l-.5 2.9h-2.7v7A10 10 0 0022 12z"/></svg>
              )},
              { key: 'instagram', url: social.instagram, bg: 'bg-gradient-to-tr from-yellow-500 via-pink-600 to-purple-700', svg: (
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm0 2a3 3 0 00-3 3v10a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H7zm5 3a5 5 0 110 10 5 5 0 010-10zm0 2.2a2.8 2.8 0 100 5.6 2.8 2.8 0 000-5.6zM18 6.5a1 1 0 110 2 1 1 0 010-2z"/></svg>
              )},
              { key: 'twitter', url: social.twitter, bg: 'bg-black', svg: (
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M3 3l8.2 10.2L3.6 21h2.2l6.1-6.7 4.9 6.7H21l-8.7-11.9L20.3 3h-2.2l-5.5 6.1L8.1 3H3z"/></svg>
              )},
              { key: 'linkedin', url: social.linkedin, bg: 'bg-sky-700', svg: (
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8.98h5V24H0V8.98zM8.98 8.98h4.78v2.05h.07c.67-1.27 2.3-2.6 4.73-2.6 5.06 0 6 3.33 6 7.66V24h-5v-6.8c0-1.62-.03-3.7-2.25-3.7-2.25 0-2.6 1.76-2.6 3.58V24h-5V8.98z"/></svg>
              )},
            ].map((i) => (
              <a key={i.key}
                 href={i.url || '#'}
                 target={i.url ? '_blank' : undefined}
                 className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border border-border ${i.bg} ${i.url ? 'opacity-100 hover:scale-105 transition-transform' : 'opacity-40 cursor-not-allowed'}`}
                 aria-label={i.key}
              >
                {i.svg}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
