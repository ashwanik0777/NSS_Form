"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Calendar, Plus, Edit, Trash2, Loader2, X, Save, Clock, MapPin, XCircle, Users } from "lucide-react"
import { useSession } from "next-auth/react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null)
  const [cancelReason, setCancelReason] = useState("")
  const [editingMeeting, setEditingMeeting] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: "",
    unitNo: "",
    meetingDate: "",
    location: "",
    startTime: "",
    endTime: "",
    locationLat: "",
    locationLng: "",
  })
  const { data: session } = useSession()
  const isSuperAdmin = (session?.user as any)?.role === "admin"
  const [projects, setProjects] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [units, setUnits] = useState<string[]>([])

  useEffect(() => {
    fetchData()
    fetchUnits()
  }, [])

  const fetchUnits = async () => {
    try {
      // Fetch units from applications or user assigned units
      const res = await fetch("/api/admin/users")
      const data = await res.json()
      if (data.success && data.users) {
        const allUnits = new Set<string>()
        data.users.forEach((user: any) => {
          if (user.assignedUnits && Array.isArray(user.assignedUnits)) {
            user.assignedUnits.forEach((unit: string) => allUnits.add(unit))
          }
        })
        setUnits(Array.from(allUnits).sort())
      }
    } catch (error) {
      console.error("Error fetching units:", error)
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch projects for dropdown
      const projectsRes = await fetch("/api/admin/projects")
      const projectsData = await projectsRes.json()
      if (projectsData.success) {
        setProjects(projectsData.projects || [])
      }

      // Fetch meetings
      const meetingsRes = await fetch("/api/admin/meetings")
      const meetingsData = await meetingsRes.json()
      if (meetingsData.success) {
        setMeetings(meetingsData.meetings || [])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.title || !formData.meetingDate) {
        setError("Please fill all required fields")
        setSubmitting(false)
        return
      }

      // Prepare meeting data
      const meetingData: any = {
        title: formData.title,
        description: formData.description || undefined,
        projectId: formData.projectId || undefined,
        unitNo: formData.unitNo || undefined,
        meetingDate: formData.meetingDate,
        location: formData.location || undefined,
        startTime: formData.startTime ? new Date(formData.startTime).toISOString() : undefined,
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
      }

      // Add coordinates if provided
      if (formData.locationLat && formData.locationLng) {
        meetingData.locationCoordinates = {
          latitude: parseFloat(formData.locationLat),
          longitude: parseFloat(formData.locationLng),
        }
      }

      let response
      if (editingMeeting) {
        // Update meeting
        response = await fetch("/api/admin/meetings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            meetingId: editingMeeting._id,
            ...meetingData,
          }),
        })
      } else {
        // Create meeting
        response = await fetch("/api/admin/meetings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(meetingData),
        })
      }

      const data = await response.json()

      if (data.success) {
        setShowModal(false)
        setEditingMeeting(null)
        setFormData({
          title: "",
          description: "",
          projectId: "",
          unitNo: "",
          meetingDate: "",
          location: "",
          startTime: "",
          endTime: "",
          locationLat: "",
          locationLng: "",
        })
        fetchData()
      } else {
        setError(data.message || "Failed to save meeting")
      }
    } catch (error) {
      console.error("Error saving meeting:", error)
      setError("Failed to save meeting. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const toLocalISOString = (dateString: string) => {
    const date = new Date(dateString)
    const offset = date.getTimezoneOffset() * 60000
    const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16)
    return localISOTime
  }

  const handleEdit = (meeting: any) => {
    setEditingMeeting(meeting)
    setFormData({
      title: meeting.title,
      description: meeting.description || "",
      projectId: meeting.projectId?._id || meeting.projectId || "",
      unitNo: meeting.unitNo || "",
      meetingDate: meeting.meetingDate ? new Date(meeting.meetingDate).toISOString().split("T")[0] : "",
      location: meeting.location || "",
      locationLat: meeting.locationCoordinates?.latitude?.toString() || "",
      locationLng: meeting.locationCoordinates?.longitude?.toString() || "",
      startTime: meeting.startTime ? toLocalISOString(meeting.startTime) : "",
      endTime: meeting.endTime ? toLocalISOString(meeting.endTime) : "",
    })
    setError(null)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this meeting?")) return

    try {
      const res = await fetch(`/api/admin/meetings?id=${id}`, {
        method: "DELETE",
      })

      const data = await res.json()
      if (data.success) {
        fetchData()
      } else {
        alert(data.message || "Failed to delete meeting")
      }
    } catch (error) {
      console.error("Error deleting meeting:", error)
      alert("Failed to delete meeting")
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          locationLat: position.coords.latitude.toString(),
          locationLng: position.coords.longitude.toString(),
        }))
      },
      (error) => {
        alert("Failed to get location: " + error.message)
      }
    )
  }

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      setError("Please provide a reason for cancellation")
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch("/api/admin/meetings/cancel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meetingId: selectedMeeting._id,
          cancelReason: cancelReason.trim(),
        }),
      })

      const data = await res.json()
      if (data.success) {
        setShowCancelModal(false)
        setSelectedMeeting(null)
        setCancelReason("")
        fetchData()
      } else {
        setError(data.message || "Failed to cancel meeting")
      }
    } catch (error) {
      console.error("Error cancelling meeting:", error)
      setError("Failed to cancel meeting. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const openCancelModal = (meeting: any) => {
    if (meeting.status === "cancelled") {
      alert("This meeting is already cancelled")
      return
    }
    setSelectedMeeting(meeting)
    setCancelReason("")
    setError(null)
    setShowCancelModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="sub-admin" requiredPermission="events.view">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center">
              <Calendar className="w-8 h-8 mr-3 text-primary" />
              Meeting Management
            </h1>
            <p className="text-muted-foreground mt-2">Create and manage NSS meetings</p>
          </div>
          <button
            onClick={() => {
              setEditingMeeting(null)
              setFormData({
                title: "",
                description: "",
                projectId: "",
                unitNo: "",
                meetingDate: "",
                location: "",
                startTime: "",
                endTime: "",
                locationLat: "",
                locationLng: "",
              })
              setError(null)
              setShowModal(true)
            }}
            className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Meeting
          </button>
        </div>

        {meetings.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Meetings</h3>
            <p className="text-muted-foreground">Start by creating your first meeting</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Title</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Project</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Unit</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date & Time</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Location</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {meetings.map((meeting) => (
                    <tr key={meeting._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-foreground">{meeting.title}</p>
                          {meeting.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{meeting.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">{meeting.projectName || "N/A"}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{meeting.unitNo || "N/A"}</td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="text-foreground">{new Date(meeting.meetingDate).toLocaleDateString()}</p>
                          {meeting.startTime && meeting.endTime && (
                            <p className="text-muted-foreground text-xs">
                              {new Date(meeting.startTime).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {new Date(meeting.endTime).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {meeting.location ? (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span className="line-clamp-1">{meeting.location}</span>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            meeting.status === "upcoming"
                              ? "bg-blue-100 text-blue-800"
                              : meeting.status === "ongoing"
                                ? "bg-yellow-100 text-yellow-800"
                                : meeting.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                          }`}
                        >
                          {meeting.status}
                        </span>
                        {meeting.cancelReason && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1" title={meeting.cancelReason}>
                            Reason: {meeting.cancelReason}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(meeting)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/admin/meetings/${meeting._id}/attendance`}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Attendance"
                          >
                            <Users className="w-4 h-4" />
                          </Link>
                          {meeting.status !== "cancelled" && (
                            <button
                              onClick={() => openCancelModal(meeting)}
                              className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                              title="Cancel"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(meeting._id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-card rounded-xl border border-border max-w-3xl w-full my-8 flex flex-col max-h-[90vh]">
              {/* Sticky Header */}
              <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card rounded-t-xl z-10">
                <h2 className="text-2xl font-bold text-foreground">
                  {editingMeeting ? "Edit Meeting" : "Add New Meeting"}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingMeeting(null)
                    setError(null)
                  }}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto flex-1 p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
                )}

                <form id="meeting-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Meeting Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter meeting title"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter meeting description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Project</label>
                      <select
                        value={formData.projectId}
                        onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">All Projects</option>
                        {projects.map((project) => (
                          <option key={project._id} value={project._id}>
                            {project.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Unit Number</label>
                      <select
                        value={formData.unitNo}
                        onChange={(e) => setFormData({ ...formData, unitNo: e.target.value })}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">All Units</option>
                        {units.map((unit) => (
                          <option key={unit} value={unit}>
                            Unit {unit}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Meeting Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.meetingDate}
                        onChange={(e) => setFormData({ ...formData, meetingDate: e.target.value })}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Start Time</label>
                      <input
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">End Time</label>
                      <input
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Enter meeting location"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-foreground">
                          Location Coordinates (for geo-fencing)
                        </label>
                        <button
                          type="button"
                          onClick={getCurrentLocation}
                          className="text-xs text-primary hover:underline flex items-center"
                        >
                          <MapPin className="w-3 h-3 mr-1" />
                          Get Current Location
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="number"
                          step="any"
                          value={formData.locationLat}
                          onChange={(e) => setFormData({ ...formData, locationLat: e.target.value })}
                          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Latitude"
                        />
                        <input
                          type="number"
                          step="any"
                          value={formData.locationLng}
                          onChange={(e) => setFormData({ ...formData, locationLng: e.target.value })}
                          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Longitude"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Sticky Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-border sticky bottom-0 bg-card rounded-b-xl">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingMeeting(null)
                    setError(null)
                  }}
                  className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="meeting-form"
                  disabled={submitting}
                  className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {editingMeeting ? "Update Meeting" : "Create Meeting"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && selectedMeeting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl border border-border max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Cancel Meeting</h2>
                <button
                  onClick={() => {
                    setShowCancelModal(false)
                    setSelectedMeeting(null)
                    setCancelReason("")
                    setError(null)
                  }}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Meeting: <span className="font-medium text-foreground">{selectedMeeting.title}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Date: {new Date(selectedMeeting.meetingDate).toLocaleDateString()}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={4}
                  required
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Please provide a reason for cancelling this meeting..."
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false)
                    setSelectedMeeting(null)
                    setCancelReason("")
                    setError(null)
                  }}
                  className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCancel}
                  disabled={submitting || !cancelReason.trim()}
                  className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Meeting
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

