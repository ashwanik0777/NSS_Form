"use client"

import { useEffect, useState } from "react"
import { Calendar, Plus, Edit, Trash2, Users, Loader2, X, Save, Clock, MapPin } from "lucide-react"
import { useSession } from "next-auth/react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportEvent, setReportEvent] = useState<any>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportSubmitting, setReportSubmitting] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [reportForm, setReportForm] = useState({
    description: "",
    attendeesCount: "",
    photoUrls: [""],
    selectedPhotoUrls: [] as string[],
    videoUrls: [""],
    sendToEmail: "",
  })
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: "",
    eventDate: "",
    location: "",
    locationLat: "",
    locationLng: "",
    startTime: "",
    endTime: "",
    coordinator: "",
    maxParticipants: "",
    status: "upcoming",
    attendanceExtensionMinutes: "",
    nssHours: "",
  })
  const { data: session } = useSession()
  const isSuperAdmin = (session?.user as any)?.role === "admin"
  const [projects, setProjects] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch projects for dropdown
      const projectsRes = await fetch("/api/admin/projects")
      const projectsData = await projectsRes.json()
      if (projectsData.success) {
        setProjects(projectsData.projects || [])
      }

      // Fetch events
      const eventsRes = await fetch("/api/admin/events")
      const eventsData = await eventsRes.json()
      if (eventsData.success) {
        setEvents(eventsData.events || [])
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
      if (!formData.title || !formData.description || !formData.projectId || !formData.eventDate) {
        setError("Please fill all required fields")
        setSubmitting(false)
        return
      }

      // Prepare event data
      const eventData: any = {
        title: formData.title,
        description: formData.description,
        projectId: formData.projectId,
        eventDate: formData.eventDate,
        location: formData.location,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        coordinator: formData.coordinator || undefined,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        status: formData.status,
        attendanceExtensionMinutes: isSuperAdmin && formData.attendanceExtensionMinutes
          ? parseInt(formData.attendanceExtensionMinutes)
          : undefined,
        nssHours: formData.nssHours ? parseFloat(formData.nssHours) : undefined,
      }

      // Add location coordinates if provided
      if (formData.locationLat && formData.locationLng) {
        eventData.locationCoordinates = {
          latitude: parseFloat(formData.locationLat),
          longitude: parseFloat(formData.locationLng),
        }
      }

      let response
      if (editingEvent) {
        // Update event
        response = await fetch("/api/admin/events", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: editingEvent._id, ...eventData }),
        })
      } else {
        // Create event
        response = await fetch("/api/admin/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eventData),
        })
      }

      const data = await response.json()

      if (!data.success) {
        setError(data.message || "Failed to save event")
        setSubmitting(false)
        return
      }

      // Close modal and refresh data
      setShowModal(false)
      setEditingEvent(null)
      setFormData({
        title: "",
        description: "",
        projectId: "",
        eventDate: "",
        location: "",
        locationLat: "",
        locationLng: "",
        startTime: "",
        endTime: "",
        coordinator: "",
        maxParticipants: "",
        status: "upcoming",
        attendanceExtensionMinutes: "",
        nssHours: "",
      })
      await fetchData()
      setSubmitting(false)
    } catch (error) {
      console.error("Error saving event:", error)
      setError("Failed to save event")
      setSubmitting(false)
    }
  }

  const handleEdit = (event: any) => {
    setEditingEvent(event)
    setFormData({
      title: event.title || "",
      description: event.description || "",
      projectId: event.projectId?._id || event.projectId || "",
      eventDate: event.eventDate ? new Date(event.eventDate).toISOString().split("T")[0] : "",
      location: event.location || "",
      locationLat: event.locationCoordinates?.latitude?.toString() || "",
      locationLng: event.locationCoordinates?.longitude?.toString() || "",
      startTime: event.startTime
        ? new Date(event.startTime).toISOString().slice(0, 16)
        : "",
      endTime: event.endTime ? new Date(event.endTime).toISOString().slice(0, 16) : "",
      coordinator: event.coordinator || "",
      maxParticipants: event.maxParticipants?.toString() || "",
      status: event.status || "upcoming",
      attendanceExtensionMinutes: event.attendanceExtensionMinutes?.toString() || "",
      nssHours: event.nssHours?.toString() || "",
    })
    setShowModal(true)
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/events?id=${eventId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!data.success) {
        alert(data.message || "Failed to delete event")
        return
      }

      await fetchData()
    } catch (error) {
      console.error("Error deleting event:", error)
      alert("Failed to delete event")
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          locationLat: position.coords.latitude.toString(),
          locationLng: position.coords.longitude.toString(),
        })
      },
      (error) => {
        alert("Failed to get location: " + error.message)
      }
    )
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
            Event Management
          </h1>
          <p className="text-muted-foreground mt-2">Create and manage NSS events</p>
        </div>
        <button
          onClick={() => {
            setEditingEvent(null)
            setFormData({
              title: "",
              description: "",
              projectId: "",
              eventDate: "",
              location: "",
              locationLat: "",
              locationLng: "",
              startTime: "",
              endTime: "",
              coordinator: "",
              maxParticipants: "",
              status: "upcoming",
              attendanceExtensionMinutes: "",
              nssHours: "",
            })
            setError(null)
            setShowModal(true)
          }}
          className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Events</h3>
          <p className="text-muted-foreground">Start by creating your first event</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Project</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date & Time</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Location</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Participants</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map((event) => (
                  <tr key={event._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground">{event.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{event.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{event.projectName || "N/A"}</td>
                    <td className="px-6 py-4 text-sm">
                      <div>
                        <p className="text-foreground">{new Date(event.eventDate).toLocaleDateString()}</p>
                        {event.startTime && event.endTime && (
                          <p className="text-muted-foreground text-xs">
                            {new Date(event.startTime).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            -{" "}
                            {new Date(event.endTime).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {event.location ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {event.currentParticipants || 0} / {event.maxParticipants || "∞"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.status === "upcoming"
                            ? "bg-blue-100 text-blue-800"
                            : event.status === "ongoing"
                              ? "bg-yellow-100 text-yellow-800"
                              : event.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(event)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {event.status === "completed" && (
                          <button
                            onClick={async () => {
                              setReportEvent(event)
                              setReportError(null)
                              setReportLoading(true)
                              setShowReportModal(true)
                              try {
                                const res = await fetch(`/api/admin/events/report?eventId=${event._id}`)
                                const data = await res.json()
                                if (data.success && data.report) {
                                  setReportForm({
                                    description: data.report.description || "",
                                    attendeesCount: String(data.report.attendeesCount || ""),
                                    photoUrls: (data.report.photoUrls && data.report.photoUrls.length > 0) ? data.report.photoUrls : [""],
                                    selectedPhotoUrls: data.report.selectedPhotoUrls || [],
                                    videoUrls: (data.report.videoUrls && data.report.videoUrls.length > 0) ? data.report.videoUrls : [""],
                                    sendToEmail: "",
                                  })
                                } else {
                                  setReportForm({
                                    description: "",
                                    attendeesCount: "",
                                    photoUrls: [""],
                                    selectedPhotoUrls: [],
                                    videoUrls: [""],
                                    sendToEmail: "",
                                  })
                                }
                              } catch (e) {
                                setReportError("Failed to load report")
                              } finally {
                                setReportLoading(false)
                              }
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Complete Report"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(event._id)}
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
                {editingEvent ? "Edit Event" : "Add New Event"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingEvent(null)
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

              <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter event title"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter event description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Project <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select Project</option>
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Event Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Location (Address)
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter event location address"
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-foreground">
                      Location Coordinates (for geofencing - 50m radius)
                    </label>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      Get Current Location
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional: Set coordinates for location-based attendance verification (50m radius)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Coordinator
                  </label>
                  <input
                    type="text"
                    value={formData.coordinator}
                    onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Coordinator name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Maximum participants"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {isSuperAdmin && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Attendance Extension (Minutes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.attendanceExtensionMinutes}
                      onChange={(e) => setFormData({ ...formData, attendanceExtensionMinutes: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Additional minutes beyond 30 min default"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Super Admin Only: Extend attendance submission deadline beyond the default 30 minutes
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    NSS Hours <span className="text-muted-foreground">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.nssHours}
                    onChange={(e) => setFormData({ ...formData, nssHours: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Enter NSS hours for this event"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Number of NSS hours volunteers will earn for attending this event
                  </p>
                </div>
              </div>
              </form>
            </div>

            {/* Sticky Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border sticky bottom-0 bg-card rounded-b-xl">
              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  setEditingEvent(null)
                  setError(null)
                }}
                className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="event-form"
                disabled={submitting}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingEvent ? "Update Event" : "Create Event"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && reportEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-xl border border-border max-w-4xl w-full my-8 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card rounded-t-xl z-10">
              <h2 className="text-2xl font-bold text-foreground">Event Report - {reportEvent.title}</h2>
              <button
                onClick={() => {
                  setShowReportModal(false)
                  setReportEvent(null)
                  setReportError(null)
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto flex-1 p-6">
              {reportLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="animate-spin w-8 h-8 text-primary" />
                </div>
              ) : (
                <>
                  {reportError && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{reportError}</div>}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                      <textarea
                        rows={4}
                        value={reportForm.description}
                        onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Describe the event outcomes, activities, impact, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Attendees Count</label>
                      <input
                        type="number"
                        min="0"
                        value={reportForm.attendeesCount}
                        onChange={(e) => setReportForm({ ...reportForm, attendeesCount: e.target.value })}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="e.g., 120"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Send Report To (Email)</label>
                      <input
                        type="email"
                        value={reportForm.sendToEmail}
                        onChange={(e) => setReportForm({ ...reportForm, sendToEmail: e.target.value })}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="recipient@example.com"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-foreground">Photo URLs (up to 10)</label>
                        <button
                          onClick={() => {
                            if (reportForm.photoUrls.length < 10) setReportForm({ ...reportForm, photoUrls: [...reportForm.photoUrls, ""] })
                          }}
                          className="text-sm text-primary hover:underline"
                        >
                          + Add Photo
                        </button>
                      </div>
                      {/* Upload photos */}
                      <div className="mb-3">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={async (e) => {
                            if (!e.target.files || e.target.files.length === 0) return
                            const files = Array.from(e.target.files)
                            const remaining = Math.max(0, 10 - reportForm.photoUrls.filter(Boolean).length)
                            const toUpload = files.slice(0, remaining)
                            for (const f of toUpload) {
                              const fd = new FormData()
                              fd.append("file", f as any)
                              try {
                                const res = await fetch("/api/uploads", { method: "POST", body: fd })
                                const data = await res.json()
                                if (data.success && data.url) {
                                  setReportForm((prev) => ({ ...prev, photoUrls: [...prev.photoUrls, data.url].slice(0, 10) }))
                                }
                              } catch {}
                            }
                            if (e.currentTarget) e.currentTarget.value = ""
                          }}
                          className="w-full px-3 py-2 border border-border rounded-lg"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Upload images or paste links below.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {reportForm.photoUrls.map((url, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="url"
                              value={url}
                              onChange={(e) => {
                                const list = [...reportForm.photoUrls]
                                list[idx] = e.target.value
                                setReportForm({ ...reportForm, photoUrls: list })
                              }}
                              className="flex-1 px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                              placeholder="https://example.com/photo.jpg"
                            />
                            <input
                              type="checkbox"
                              checked={reportForm.selectedPhotoUrls.includes(url) && !!url}
                              onChange={(e) => {
                                const sel = new Set(reportForm.selectedPhotoUrls)
                                if (e.target.checked) {
                                  if (url && !sel.has(url) && sel.size < 4) sel.add(url)
                                } else {
                                  sel.delete(url)
                                }
                                setReportForm({ ...reportForm, selectedPhotoUrls: Array.from(sel) })
                              }}
                              title="Mark as selected (max 4)"
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Tick up to 4 photos to include in the report email.</p>
                    </div>

                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-foreground">Video Links (up to 4)</label>
                        <button
                          onClick={() => {
                            if (reportForm.videoUrls.length < 4) setReportForm({ ...reportForm, videoUrls: [...reportForm.videoUrls, ""] })
                          }}
                          className="text-sm text-primary hover:underline"
                        >
                          + Add Video
                        </button>
                      </div>
                      {/* Upload videos */}
                      <div className="mb-3">
                        <input
                          type="file"
                          accept="video/*"
                          multiple
                          onChange={async (e) => {
                            if (!e.target.files || e.target.files.length === 0) return
                            const files = Array.from(e.target.files)
                            const remaining = Math.max(0, 4 - reportForm.videoUrls.filter(Boolean).length)
                            const toUpload = files.slice(0, remaining)
                            for (const f of toUpload) {
                              const fd = new FormData()
                              fd.append("file", f as any)
                              try {
                                const res = await fetch("/api/uploads", { method: "POST", body: fd })
                                const data = await res.json()
                                if (data.success && data.url) {
                                  setReportForm((prev) => ({ ...prev, videoUrls: [...prev.videoUrls, data.url].slice(0, 4) }))
                                }
                              } catch {}
                            }
                            e.currentTarget.value = ""
                          }}
                          className="w-full px-3 py-2 border border-border rounded-lg"
                        />
                        <p className="text-xs text-muted-foreground mt-1">Upload videos or paste external links (YouTube/Drive).</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {reportForm.videoUrls.map((url, idx) => (
                          <input
                            key={idx}
                            type="url"
                            value={url}
                            onChange={(e) => {
                              const list = [...reportForm.videoUrls]
                              list[idx] = e.target.value
                              setReportForm({ ...reportForm, videoUrls: list })
                            }}
                            className="px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="https://youtube.com/... or media link"
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Use links for large videos (YouTube/Drive/media URL).</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border sticky bottom-0 bg-card rounded-b-xl">
              <button
                onClick={() => {
                  setShowReportModal(false)
                  setReportEvent(null)
                  setReportError(null)
                }}
                className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  if (!reportEvent) return
                  setReportSubmitting(true)
                  setReportError(null)
                  try {
                    const res = await fetch("/api/admin/events/report", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        eventId: reportEvent._id,
                        description: reportForm.description,
                        attendeesCount: parseInt(reportForm.attendeesCount || "0", 10) || 0,
                        photoUrls: reportForm.photoUrls.filter(Boolean).slice(0, 10),
                        selectedPhotoUrls: reportForm.selectedPhotoUrls.filter(Boolean).slice(0, 4),
                        videoUrls: reportForm.videoUrls.filter(Boolean).slice(0, 4),
                      }),
                    })
                    const data = await res.json()
                    if (!data.success) {
                      setReportError(data.message || "Failed to save report")
                    } else {
                      // saved
                    }
                  } catch (e) {
                    setReportError("Failed to save report")
                  } finally {
                    setReportSubmitting(false)
                  }
                }}
                disabled={reportSubmitting}
                className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {reportSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Report
              </button>
              <button
                onClick={async () => {
                  if (!reportEvent || !reportForm.sendToEmail) {
                    setReportError("Enter recipient email to send report")
                    return
                  }
                  setReportSubmitting(true)
                  setReportError(null)
                  try {
                    // Ensure saved before sending
                    await fetch("/api/admin/events/report", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        eventId: reportEvent._id,
                        description: reportForm.description,
                        attendeesCount: parseInt(reportForm.attendeesCount || "0", 10) || 0,
                        photoUrls: reportForm.photoUrls.filter(Boolean).slice(0, 10),
                        selectedPhotoUrls: reportForm.selectedPhotoUrls.filter(Boolean).slice(0, 4),
                        videoUrls: reportForm.videoUrls.filter(Boolean).slice(0, 4),
                      }),
                    })

                    const res = await fetch("/api/admin/events/report/send", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ eventId: reportEvent._id, email: reportForm.sendToEmail }),
                    })
                    const data = await res.json()
                    if (!data.success) {
                      setReportError(data.message || "Failed to send report")
                    } else {
                      setShowReportModal(false)
                      setReportEvent(null)
                    }
                  } catch (e) {
                    setReportError("Failed to send report")
                  } finally {
                    setReportSubmitting(false)
                  }
                }}
                disabled={reportSubmitting}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {reportSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Clock className="w-4 h-4 mr-2" />}
                Send Report Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  )
}
