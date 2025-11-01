"use client"

import { useEffect, useState } from "react"
import {
  TrendingUp,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  BarChart3,
  Award,
  Loader2,
  X,
} from "lucide-react"

interface Volunteer {
  _id: string
  name: string
  email: string
  application?: {
    formNo: string
    institutionName: string
    status: string
  }
  stats: {
    projects: number
    events: number
    completedEvents: number
    totalHours: number
    attendanceRate: number
  }
}

interface VolunteerDetail {
  _id: string
  name: string
  email: string
  application?: any
  project?: any
  stats: {
    totalEvents: number
    completedEvents: number
    totalHours: number
    attendanceRate: number
  }
  events: Array<{
    _id: string
    eventTitle: string
    projectTitle: string
    status: string
    startTime?: string
    endTime?: string
    hoursWorked: number
    workDescription?: string
  }>
}

interface Analytics {
  totalVolunteers: number
  totalActiveProjects: number
  totalEvents: number
  totalEventParticipations: number
  avgAttendanceRate: number
}

export default function VolunteerManagementPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerDetail | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch("/api/admin/volunteer-management")
      const data = await res.json()
      if (data.success) {
        setVolunteers(data.volunteers || [])
        setAnalytics(data.analytics || null)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVolunteerDetail = async (volunteerId: string) => {
    try {
      const res = await fetch(`/api/admin/volunteer-management?volunteerId=${volunteerId}`)
      const data = await res.json()
      if (data.success) {
        setSelectedVolunteer(data.volunteer)
        setShowDetailModal(true)
      }
    } catch (error) {
      console.error("Error fetching volunteer detail:", error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <TrendingUp className="w-8 h-8 mr-3 text-primary" />
          Volunteer Management
        </h1>
        <p className="text-muted-foreground mt-2">Track volunteer activities, events, and progress</p>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Volunteers</p>
                <p className="text-3xl font-bold text-foreground mt-2">{analytics.totalVolunteers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-3xl font-bold text-foreground mt-2">{analytics.totalActiveProjects}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-3xl font-bold text-foreground mt-2">{analytics.totalEvents}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Attendance</p>
                <p className="text-3xl font-bold text-foreground mt-2">{analytics.avgAttendanceRate}%</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Volunteers Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Institution</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Projects</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Events</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Hours</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Attendance</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {volunteers.map((volunteer) => (
                <tr key={volunteer._id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-foreground">{volunteer.application?.nameEnglish || volunteer.name}</p>
                      <p className="text-sm text-muted-foreground">{volunteer.email}</p>
                      {volunteer.application?.mobileNo && (
                        <p className="text-xs text-muted-foreground">{volunteer.application.mobileNo}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>
                      <p className="text-foreground">{volunteer.application?.institutionName || "N/A"}</p>
                      {volunteer.application?.departmentName && (
                        <p className="text-xs text-muted-foreground">{volunteer.application.departmentName}</p>
                      )}
                      {volunteer.application?.courseName && (
                        <p className="text-xs text-muted-foreground">{volunteer.application.courseName}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {volunteer.stats.projects}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      {volunteer.stats.events}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-sm text-foreground">
                      <Clock className="w-4 h-4 mr-1" />
                      {volunteer.stats.totalHours}h
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          volunteer.stats.attendanceRate >= 80
                            ? "bg-green-100 text-green-800"
                            : volunteer.stats.attendanceRate >= 50
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {volunteer.stats.attendanceRate}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => fetchVolunteerDetail(volunteer._id)}
                      className="flex items-center px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Volunteer Detail Modal */}
      {showDetailModal && selectedVolunteer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedVolunteer.name}</h2>
                <p className="text-muted-foreground">{selectedVolunteer.email}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setSelectedVolunteer(null)
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold text-foreground mt-1">{selectedVolunteer.stats.totalEvents}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {selectedVolunteer.stats.completedEvents}
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold text-foreground mt-1">{selectedVolunteer.stats.totalHours}h</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">Attendance</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {selectedVolunteer.stats.attendanceRate}%
                </p>
              </div>
            </div>

            {/* Application Details */}
            {selectedVolunteer.application && (
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-foreground mb-3">Application Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Form Number</p>
                    <p className="text-foreground font-medium">{selectedVolunteer.application.formNo}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Institution</p>
                    <p className="text-foreground font-medium">{selectedVolunteer.application.institutionName}</p>
                  </div>
                  {selectedVolunteer.application.departmentName && (
                    <div>
                      <p className="text-muted-foreground">Department</p>
                      <p className="text-foreground font-medium">{selectedVolunteer.application.departmentName}</p>
                    </div>
                  )}
                  {selectedVolunteer.application.courseName && (
                    <div>
                      <p className="text-muted-foreground">Course</p>
                      <p className="text-foreground font-medium">{selectedVolunteer.application.courseName}</p>
                    </div>
                  )}
                  {selectedVolunteer.application.mobileNo && (
                    <div>
                      <p className="text-muted-foreground">Mobile</p>
                      <p className="text-foreground font-medium">{selectedVolunteer.application.mobileNo}</p>
                    </div>
                  )}
                  {selectedVolunteer.application.enrollment && (
                    <div>
                      <p className="text-muted-foreground">Enrollment</p>
                      <p className="text-foreground font-medium">{selectedVolunteer.application.enrollment}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Project Info */}
            {selectedVolunteer.project && (
              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-foreground mb-2">Current Project</h3>
                <p className="text-foreground font-medium">{selectedVolunteer.project.title}</p>
                <p className="text-sm text-muted-foreground">{selectedVolunteer.project.description}</p>
              </div>
            )}

            {/* Events List */}
            <div>
              <h3 className="font-semibold text-foreground mb-4">Event History</h3>
              <div className="space-y-3">
                {selectedVolunteer.events.length > 0 ? (
                  selectedVolunteer.events.map((event) => (
                    <div key={event._id} className="bg-muted/50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-foreground">{event.eventTitle}</p>
                          <p className="text-sm text-muted-foreground">{event.projectTitle}</p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            event.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : event.status === "started"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {event.status}
                        </span>
                      </div>
                      {event.workDescription && (
                        <p className="text-sm text-muted-foreground mb-2">{event.workDescription}</p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        {event.startTime && (
                          <span>
                            Start: {new Date(event.startTime).toLocaleString()}
                          </span>
                        )}
                        {event.endTime && (
                          <span>
                            End: {new Date(event.endTime).toLocaleString()}
                          </span>
                        )}
                        {event.hoursWorked > 0 && (
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {event.hoursWorked}h
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No events yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

