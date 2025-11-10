"use client"

import { useState, useEffect } from "react"
import AdminHeader from "@/components/admin/AdminHeader"

interface DashboardStats {
  totalApplications: number
  pendingReview: number
  approved: number
  rejected: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
  })
  const [loading, setLoading] = useState(true)
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
  const [social, setSocial] = useState<{facebook?: string; instagram?: string; twitter?: string; linkedin?: string}>({})

  useEffect(() => {
    fetchStats()
    fetchSocial()
    fetchMeetingStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Fetch stats from different status endpoints
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

      setStats({
        totalApplications: totalData.pagination?.total || 0,
        pendingReview: pendingData.pagination?.total || 0,
        approved: approvedData.pagination?.total || 0,
        rejected: rejectedData.pagination?.total || 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setLoading(false)
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

  const statCards = [
    {
      title: "Total Applications",
      value: stats.totalApplications,
      icon: (
        <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
    },
    {
      title: "Pending Review",
      value: stats.pendingReview,
      icon: (
        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
    },
    {
      title: "Approved",
      value: stats.approved,
      icon: (
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgColor: "bg-green-50",
      textColor: "text-green-600",
    },
    {
      title: "Rejected",
      value: stats.rejected,
      icon: (
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      bgColor: "bg-red-50",
      textColor: "text-red-600",
    },
  ]

  return (
    <>
      <AdminHeader title="Dashboard" subtitle="NSS Application Management Overview" />

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((card, index) => (
            <div key={index} className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <p className="text-3xl font-bold text-foreground">{loading ? "..." : card.value}</p>
                </div>
                <div className={`p-3 rounded-full ${card.bgColor}`}>{card.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Meetings Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Meetings Overview</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-muted/40 border border-border/50 rounded-lg p-4">
                <p className="text-muted-foreground text-xs mb-1">Total</p>
                <p className="text-xl font-bold">{meetings.total}</p>
              </div>
              <div className="bg-muted/40 border border-border/50 rounded-lg p-4">
                <p className="text-muted-foreground text-xs mb-1">Upcoming/Ongoing</p>
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
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Meeting Attendance</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
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

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <a
                href="/admin/applications"
                className="flex items-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <svg className="w-5 h-5 text-primary mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm font-medium text-foreground">Review Applications</span>
              </a>
              <a
                href="/admin/users"
                className="flex items-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <svg className="w-5 h-5 text-primary mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
                <span className="text-sm font-medium text-foreground">Manage Users</span>
              </a>
              <a
                href="/admin/reports"
                className="flex items-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <svg className="w-5 h-5 text-primary mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <span className="text-sm font-medium text-foreground">Generate Reports</span>
              </a>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center p-3 bg-muted/25 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">New application submitted</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-muted/25 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Application approved</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
              <div className="flex items-center p-3 bg-muted/25 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Application under review</p>
                  <p className="text-xs text-muted-foreground">3 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NSS Social Media */}
        <div className="mt-8 bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">NSS Social Media</h3>
            <a href="/admin/social-links" className="text-sm text-primary hover:underline">Edit Links</a>
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
