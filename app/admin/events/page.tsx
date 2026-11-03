"use client"

import { useEffect, useState } from "react"
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Users,
  Loader2,
  X,
  Save,
  Clock,
  MapPin,
  CheckCircle,
  Search,
  Ban,
  RotateCcw,
  AlertTriangle,
  Play,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Camera,
  XCircle,
  Pencil,
  Check,
} from "lucide-react"
import { useSession } from "next-auth/react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import EventLocationPicker from "@/components/admin/EventLocationPicker"

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
    totalRegistrations: 0,
    totalVerifiedAttendance: 0,
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)

  // Filtering & Search for Events
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  // Report Modal
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

  // Create form default values
  const createEmptyForm = () => ({
    title: "",
    description: "",
    projectId: "",
    eventDate: "",
    location: "",
    locationLat: "",
    locationLng: "",
    attendanceRadius: "50",
    startTime: "",
    endTime: "",
    coordinator: "",
    maxParticipants: "",
    attendanceExtensionMinutes: "",
    nssHours: "",
  })
  const [formData, setFormData] = useState(createEmptyForm)

  const { data: session } = useSession()
  const isSuperAdmin = (session?.user as any)?.role === "admin"
  const [projects, setProjects] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  // Participants modal states
  const [showParticipantsModal, setShowParticipantsModal] = useState(false)
  const [participantsEvent, setParticipantsEvent] = useState<any>(null)
  const [participantsData, setParticipantsData] = useState<any>(null)
  const [participantsLoading, setParticipantsLoading] = useState(false)
  const [participantsError, setParticipantsError] = useState<string | null>(null)
  const [participantSearch, setParticipantSearch] = useState("")
  const [participantFilter, setParticipantFilter] = useState<string>("all")

  // Photo viewer modal state
  const [photoModalParticipant, setPhotoModalParticipant] = useState<any>(null)

  // Edit attendance modal state
  const [editingParticipant, setEditingParticipant] = useState<any>(null)
  const [editForm, setEditForm] = useState({
    reviewStatus: "approved",
    hoursWorked: "0",
    reviewNotes: "",
  })
  const [editSubmitting, setEditSubmitting] = useState(false)

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalEvents, setTotalEvents] = useState(0)
  const eventsPerPage = 10

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    fetchData(currentPage, statusFilter, debouncedSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, debouncedSearch])

  const fetchData = async (
    page = currentPage,
    status = statusFilter,
    search = debouncedSearch,
  ) => {
    try {
      setLoading(true)
      if (projects.length === 0) {
        const projectsRes = await fetch("/api/admin/projects")
        const projectsData = await projectsRes.json()
        if (projectsData.success) {
          setProjects(projectsData.projects || [])
        }
      }

      const params = new URLSearchParams()
      params.set("page", page.toString())
      params.set("limit", eventsPerPage.toString())
      if (status && status !== "all") params.set("status", status)
      if (search) params.set("search", search)

      const eventsRes = await fetch(`/api/admin/events?${params.toString()}`)
      const eventsData = await eventsRes.json()

      if (eventsData.success) {
        setEvents(eventsData.events || [])
        if (eventsData.stats) {
          setStats(eventsData.stats)
        }
        const computedPages = Math.max(1, eventsData.pagination?.pages || 1)
        setTotalPages(computedPages)
        setTotalEvents(eventsData.pagination?.total ?? eventsData.events?.length ?? 0)
        if (page > computedPages && computedPages > 0) {
          setCurrentPage(computedPages)
        }
      }
    } catch (err) {
      console.error("Error fetching events:", err)
      setError("Failed to fetch events data")
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return
    setCurrentPage(page)
  }

  const handleBulkApprove = async () => {
    if (
      !participantsEvent ||
      !confirm(
        "Are you sure you want to approve ALL pending participants? This will award NSS Hours based on the event's configured hours.",
      )
    )
      return

    setParticipantsLoading(true)
    try {
      const res = await fetch("/api/admin/events/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: participantsEvent._id,
          action: "approve",
        }),
      })
      const data = await res.json()
      if (data.success) {
        await handleViewParticipants(participantsEvent)
      } else {
        setParticipantsError(data.message || "Failed to bulk approve")
        setParticipantsLoading(false)
      }
    } catch (e) {
      console.error(e)
      setParticipantsError("Failed to bulk approve")
      setParticipantsLoading(false)
    }
  }

  const handleViewParticipants = async (event: any) => {
    setParticipantsEvent(event)
    setParticipantsData(null)
    setParticipantsError(null)
    setParticipantFilter("all")
    setParticipantSearch("")
    setShowParticipantsModal(true)
    setParticipantsLoading(true)
    try {
      const res = await fetch(`/api/admin/events/participants?eventId=${event._id}`)
      const data = await res.json()
      if (data.success) {
        setParticipantsData(data)
      } else {
        setParticipantsError(data.message || "Failed to load participants")
      }
    } catch (err) {
      console.error("Participants fetch error:", err)
      setParticipantsError("Failed to load participants")
    } finally {
      setParticipantsLoading(false)
    }
  }

  const closeParticipantsModal = () => {
    setShowParticipantsModal(false)
    setParticipantsEvent(null)
    setParticipantsData(null)
    setParticipantsError(null)
    setParticipantSearch("")
    setEditingParticipant(null)
    setPhotoModalParticipant(null)
  }

  const openEditAttendance = (participant: any) => {
    const defaultHours =
      participant.hoursWorked > 0
        ? participant.hoursWorked.toString()
        : participant.pendingHours > 0
          ? participant.pendingHours.toString()
          : (participantsEvent?.nssHours || participantsData?.event?.nssHours || 0).toString()

    setEditingParticipant(participant)
    setEditForm({
      reviewStatus:
        participant.attendanceReviewStatus && participant.attendanceReviewStatus !== "not-submitted"
          ? participant.attendanceReviewStatus
          : "approved",
      hoursWorked: defaultHours,
      reviewNotes: participant.reviewNotes || "",
    })
  }

  const handleSaveAttendance = async () => {
    if (!participantsEvent || !editingParticipant) return
    setEditSubmitting(true)
    try {
      const res = await fetch("/api/admin/events/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: participantsEvent._id,
          volunteerId: editingParticipant.volunteerId,
          action: "edit",
          reviewStatus: editForm.reviewStatus,
          hoursWorked: parseFloat(editForm.hoursWorked || "0"),
          reviewNotes: editForm.reviewNotes,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setEditingParticipant(null)
        await handleViewParticipants(participantsEvent)
      } else {
        alert(data.message || "Failed to update attendance")
      }
    } catch (err) {
      console.error("Save attendance error:", err)
      alert("Failed to update attendance. Please try again.")
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleOpenReport = async (event: any) => {
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
          photoUrls:
            data.report.photoUrls && data.report.photoUrls.length > 0
              ? data.report.photoUrls
              : [""],
          selectedPhotoUrls: data.report.selectedPhotoUrls || [],
          videoUrls:
            data.report.videoUrls && data.report.videoUrls.length > 0
              ? data.report.videoUrls
              : [""],
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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (!formData.title.trim() || !formData.description.trim() || !formData.projectId || !formData.eventDate) {
        setError("Please fill all required fields (Title, Description, Project, Event Date)")
        setSubmitting(false)
        return
      }

      const latNum = parseFloat(formData.locationLat)
      const lngNum = parseFloat(formData.locationLng)
      const hasCoords =
        !isNaN(latNum) &&
        !isNaN(lngNum) &&
        formData.locationLat.trim() !== "" &&
        formData.locationLng.trim() !== ""

      const eventData: any = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        projectId: formData.projectId,
        eventDate: formData.eventDate,
        location: formData.location.trim() || undefined,
        locationCoordinates: hasCoords
          ? {
              latitude: latNum,
              longitude: lngNum,
            }
          : null,
        attendanceRadius: formData.attendanceRadius ? parseInt(formData.attendanceRadius) : 50,
        startTime: formData.startTime ? new Date(formData.startTime).toISOString() : undefined,
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
        coordinator: formData.coordinator.trim() || undefined,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        attendanceExtensionMinutes: formData.attendanceExtensionMinutes
          ? parseInt(formData.attendanceExtensionMinutes)
          : undefined,
        nssHours: formData.nssHours ? parseFloat(formData.nssHours) : undefined,
      }

      let response
      if (editingEvent) {
        response = await fetch("/api/admin/events", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: editingEvent._id, ...eventData }),
        })
      } else {
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

      setShowModal(false)
      setEditingEvent(null)
      setFormData(createEmptyForm())
      await fetchData(currentPage, statusFilter, debouncedSearch)
      setSubmitting(false)
    } catch (err) {
      console.error("Error saving event:", err)
      setError("Failed to save event. Check network or server logs.")
      setSubmitting(false)
    }
  }

  const toLocalISOString = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ""
      const offset = date.getTimezoneOffset() * 60000
      return new Date(date.getTime() - offset).toISOString().slice(0, 16)
    } catch {
      return ""
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
      locationLat:
        event.locationCoordinates?.latitude !== undefined
          ? event.locationCoordinates.latitude.toString()
          : "",
      locationLng:
        event.locationCoordinates?.longitude !== undefined
          ? event.locationCoordinates.longitude.toString()
          : "",
      attendanceRadius: (event.attendanceRadius || 50).toString(),
      startTime: event.startTime ? toLocalISOString(event.startTime) : "",
      endTime: event.endTime ? toLocalISOString(event.endTime) : "",
      coordinator: event.coordinator || "",
      maxParticipants: event.maxParticipants?.toString() || "",
      attendanceExtensionMinutes: event.attendanceExtensionMinutes?.toString() || "",
      nssHours: event.nssHours?.toString() || "",
    })
    setError(null)
    setShowModal(true)
  }

  const handleToggleCancel = async (event: any) => {
    const isCancelled = event.status === "cancelled"
    const confirmMsg = isCancelled
      ? `Reactivate event "${event.title}"? Status will switch to upcoming/ongoing.`
      : `Cancel event "${event.title}"? Volunteers will no longer be able to register or attend.`

    if (!confirm(confirmMsg)) return

    try {
      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event._id,
          status: isCancelled ? "upcoming" : "cancelled",
        }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchData(currentPage, statusFilter, debouncedSearch)
      } else {
        alert(data.message || "Failed to update event status")
      }
    } catch {
      alert("Failed to update event status")
    }
  }

  const handleDelete = async (eventId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this event? This will also remove registrations and attendance records for this event.",
      )
    ) {
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

      await fetchData(currentPage, statusFilter, debouncedSearch)
    } catch (err) {
      console.error("Error deleting event:", err)
      alert("Failed to delete event")
    }
  }

  // Filtered participants list
  const filteredParticipants = (participantsData?.participants || []).filter((p: any) => {
    const matchesSearch =
      p.name?.toLowerCase().includes(participantSearch.toLowerCase()) ||
      p.email?.toLowerCase().includes(participantSearch.toLowerCase())

    if (!matchesSearch) return false

    if (participantFilter === "pending") {
      return p.attendanceReviewStatus === "pending"
    } else if (participantFilter === "approved") {
      return p.attendanceReviewStatus === "approved"
    } else if (participantFilter === "rejected") {
      return p.attendanceReviewStatus === "rejected"
    } else if (participantFilter === "not-submitted") {
      return !p.attendanceReviewStatus || p.attendanceReviewStatus === "not-submitted"
    } else if (participantFilter === "with-photo") {
      return Boolean(p.photo || p.startPhoto || p.endPhoto)
    }
    return true
  })

  return (
    <ProtectedRoute requiredRole="sub-admin" requiredPermission="events.view">
      <div className="p-3 sm:p-6 space-y-5 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-primary shrink-0" />
              Event Management
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">
              Create and manage NSS events, track verified attendance with 50m geofencing, and review volunteer evidence.
            </p>
          </div>

          <button
            onClick={() => {
              setEditingEvent(null)
              setFormData(createEmptyForm())
              setError(null)
              setShowModal(true)
            }}
            className="flex items-center justify-center px-3.5 py-2 sm:px-4 sm:py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-sm font-semibold text-xs sm:text-sm gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add New Event
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
          {/* Total Events */}
          <div
            onClick={() => {
              setStatusFilter("all")
              setCurrentPage(1)
            }}
            className={`cursor-pointer rounded-xl border p-3 sm:p-4 transition-all duration-200 hover:shadow-md ${
              statusFilter === "all"
                ? "ring-2 ring-primary border-primary bg-primary/5"
                : "bg-card border-border hover:border-primary/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">Total Events</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground mt-1 sm:mt-2">{stats.total || 0}</p>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground">All NSS events</span>
          </div>

          {/* Upcoming */}
          <div
            onClick={() => {
              setStatusFilter("upcoming")
              setCurrentPage(1)
            }}
            className={`cursor-pointer rounded-xl border p-3 sm:p-4 transition-all duration-200 hover:shadow-md ${
              statusFilter === "upcoming"
                ? "ring-2 ring-sky-500 border-sky-500 bg-sky-500/5"
                : "bg-card border-border hover:border-sky-500/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">Upcoming</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground mt-1 sm:mt-2">{stats.upcoming || 0}</p>
            <span className="text-[10px] sm:text-[11px] text-sky-600 font-medium">Scheduled &amp; Open</span>
          </div>

          {/* Ongoing */}
          <div
            onClick={() => {
              setStatusFilter("ongoing")
              setCurrentPage(1)
            }}
            className={`cursor-pointer rounded-xl border p-3 sm:p-4 transition-all duration-200 hover:shadow-md ${
              statusFilter === "ongoing"
                ? "ring-2 ring-amber-500 border-amber-500 bg-amber-500/5"
                : "bg-card border-border hover:border-amber-500/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">Ongoing Now</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center relative">
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground mt-1 sm:mt-2">{stats.ongoing || 0}</p>
            <span className="text-[10px] sm:text-[11px] text-amber-600 font-medium">In progress now</span>
          </div>

          {/* Completed */}
          <div
            onClick={() => {
              setStatusFilter("completed")
              setCurrentPage(1)
            }}
            className={`cursor-pointer rounded-xl border p-3 sm:p-4 transition-all duration-200 hover:shadow-md ${
              statusFilter === "completed"
                ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-500/5"
                : "bg-card border-border hover:border-emerald-500/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">Completed</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground mt-1 sm:mt-2">{stats.completed || 0}</p>
            <span className="text-[10px] sm:text-[11px] text-emerald-600 font-medium">Finished events</span>
          </div>

          {/* Turnout & Attendance */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-1 rounded-xl border border-border bg-card p-3 sm:p-4 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">Volunteer Attendance</span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-1 sm:mt-2">
              <p className="text-xl sm:text-2xl font-bold text-foreground">{stats.totalVerifiedAttendance || 0}</p>
              <span className="text-[11px] text-muted-foreground">/ {stats.totalRegistrations || 0} reg.</span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-purple-600 font-medium">
              {stats.totalRegistrations > 0
                ? `${Math.round((stats.totalVerifiedAttendance / stats.totalRegistrations) * 100)}% verified turnout`
                : "No registrations yet"}
            </span>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between bg-card border border-border rounded-xl p-2.5 sm:p-3 shadow-xs">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events by title, project, location..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 sm:pb-0">
            {(
              [
                { id: "all", label: "All" },
                { id: "upcoming", label: "Upcoming" },
                { id: "ongoing", label: "Ongoing" },
                { id: "completed", label: "Completed" },
                { id: "cancelled", label: "Cancelled" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id)
                  setCurrentPage(1)
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === tab.id
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "bg-muted/40 hover:bg-muted text-muted-foreground border border-border"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Events Content */}
        {loading ? (
          <div className="bg-card rounded-xl border border-border p-16 text-center">
            <Loader2 className="animate-spin w-8 h-8 text-primary mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Loading NSS events...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-10 text-center shadow-xs">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-semibold text-foreground mb-1">No Events Found</h3>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-md mx-auto mb-4">
              {searchQuery || statusFilter !== "all"
                ? "No events match your current filter or search criteria. Try resetting filters."
                : "Get started by scheduling your first NSS event with location-based 50m attendance geofencing."}
            </p>
            {searchQuery || statusFilter !== "all" ? (
              <button
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setCurrentPage(1)
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-xs font-medium hover:bg-secondary/80"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => {
                  setEditingEvent(null)
                  setFormData(createEmptyForm())
                  setError(null)
                  setShowModal(true)
                }}
                className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add First Event
              </button>
            )}
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
            {/* 1. Mobile Cards View (block md:hidden) */}
            <div className="block md:hidden p-3 space-y-3">
              {events.map((event) => (
                <div
                  key={event._id}
                  className="bg-card rounded-xl border border-border p-3.5 space-y-3 shadow-2xs hover:border-primary/40 transition-colors"
                >
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                        event.status === "upcoming"
                          ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20"
                          : event.status === "ongoing"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                            : event.status === "completed"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                              : "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20"
                      }`}
                    >
                      {event.status === "ongoing" && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                        </span>
                      )}
                      {event.status}
                    </span>

                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground border border-border truncate max-w-[160px]">
                      {event.projectName || "General NSS"}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="font-bold text-foreground text-sm leading-snug">{event.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  {/* Coordinator & NSS Hours */}
                  <div className="flex items-center justify-between gap-2 text-xs flex-wrap pt-1 border-t border-border/50">
                    {event.coordinator ? (
                      <span className="text-muted-foreground text-[11px]">
                        Coord: <strong className="text-foreground">{event.coordinator}</strong>
                      </span>
                    ) : (
                      <span />
                    )}
                    {typeof event.nssHours === "number" && event.nssHours > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        {event.nssHours} NSS Hours
                      </span>
                    )}
                  </div>

                  {/* Date & Time */}
                  <div className="bg-muted/40 rounded-xl p-2.5 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>
                        {new Date(event.eventDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    {event.startTime && (
                      <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>
                          {new Date(event.startTime).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {event.endTime &&
                            ` - ${new Date(event.endTime).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Location & 50m Geofence */}
                  {event.location && (
                    <div className="text-xs space-y-1">
                      <div className="flex items-start gap-1 text-foreground">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span className="line-clamp-2 font-medium">{event.location}</span>
                      </div>
                      {event.locationCoordinates?.latitude && event.locationCoordinates?.longitude ? (
                        <div className="flex items-center gap-2 pl-4.5 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <MapPin className="w-2.5 h-2.5 text-emerald-600" /> {event.attendanceRadius || 50}m geofence active
                          </span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${event.locationCoordinates.latitude},${event.locationCoordinates.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-primary hover:underline font-medium inline-flex items-center gap-0.5"
                          >
                            Maps <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground pl-4.5 block">
                          No geofence (Open)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Participants & Verified Stats */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      {event?.participantStats?.registered ?? event.currentParticipants ?? 0} Registered
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <span className="text-emerald-600 font-semibold">
                        {event.participantStats?.approvedAttendance || 0} Verified
                      </span>
                      {(event.participantStats?.pendingAttendance || 0) > 0 && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 font-semibold text-[10px]">
                          {event.participantStats?.pendingAttendance} pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 flex items-center gap-1.5 border-t border-border/50">
                    <button
                      onClick={() => handleViewParticipants(event)}
                      className="flex-1 py-2 px-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Attendance &amp; Photos
                    </button>

                    <button
                      onClick={() => handleEdit(event)}
                      className="p-2 border border-border bg-background hover:bg-muted rounded-lg text-primary transition-colors"
                      title="Edit Event"
                    >
                      <Edit className="w-4 h-4" />
                    </button>

                    {event.status === "completed" && (
                      <button
                        onClick={() => handleOpenReport(event)}
                        className="p-2 border border-border bg-background hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg text-emerald-600 transition-colors"
                        title="Complete Report"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      onClick={() => handleToggleCancel(event)}
                      className="p-2 border border-border bg-background hover:bg-muted rounded-lg text-muted-foreground transition-colors"
                      title={event.status === "cancelled" ? "Reactivate" : "Cancel"}
                    >
                      {event.status === "cancelled" ? (
                        <RotateCcw className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Ban className="w-4 h-4 text-amber-600" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(event._id)}
                      className="p-2 border border-border bg-background hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-red-600 transition-colors"
                      title="Delete Event"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. Desktop Full Table View (hidden md:block) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left min-w-[950px]">
                <thead className="bg-muted/60 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Event Details</th>
                    <th className="px-5 py-3.5">Project</th>
                    <th className="px-5 py-3.5">Date &amp; Time</th>
                    <th className="px-5 py-3.5">Venue &amp; 50m Geofence</th>
                    <th className="px-5 py-3.5">Participants &amp; Attendance</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {events.map((event) => (
                    <tr key={event._id} className="hover:bg-muted/30 transition-colors">
                      {/* Title & Description */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground text-sm line-clamp-1">{event.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                            {event.description}
                          </p>
                          {event.coordinator && (
                            <span className="inline-block text-[11px] text-muted-foreground">
                              Coordinator: <span className="text-foreground font-medium">{event.coordinator}</span>
                            </span>
                          )}
                          {typeof event.nssHours === "number" && event.nssHours > 0 && (
                            <span className="inline-block ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                              {event.nssHours} NSS Hours
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Project */}
                      <td className="px-5 py-4 text-xs font-medium text-foreground">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-muted text-foreground border border-border">
                          {event.projectName || "General NSS"}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="px-5 py-4 text-xs whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground">
                            {new Date(event.eventDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </p>
                          {event.startTime ? (
                            <p className="text-muted-foreground text-[11px] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-primary shrink-0" />
                              {new Date(event.startTime).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                              {event.endTime &&
                                ` - ${new Date(event.endTime).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`}
                            </p>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">All day</span>
                          )}
                        </div>
                      </td>

                      {/* Venue & Geofencing */}
                      <td className="px-5 py-4 text-xs max-w-xs">
                        {event.location ? (
                          <div className="space-y-1.5">
                            <div className="flex items-start gap-1 text-foreground font-medium">
                              <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{event.location}</span>
                            </div>
                            {event.locationCoordinates?.latitude && event.locationCoordinates?.longitude ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                                  <MapPin className="w-2.5 h-2.5 text-emerald-600" /> {event.attendanceRadius || 50}m radius active
                                </span>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${event.locationCoordinates.latitude},${event.locationCoordinates.longitude}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-primary hover:underline font-medium inline-flex items-center gap-0.5"
                                  title="View on Google Maps"
                                >
                                  View Pin <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </div>
                            ) : (
                              <span className="inline-block text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                No geofence (Open)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">Venue TBA</span>
                        )}
                      </td>

                      {/* Participants & Verified Attendance */}
                      <td className="px-5 py-4 text-xs">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 font-semibold text-foreground whitespace-nowrap">
                            <Users className="w-3.5 h-3.5 text-primary" />
                            <span>
                              {event?.participantStats?.registered ?? event.currentParticipants ?? 0} /{" "}
                              {event.maxParticipants || "∞"} Registered
                            </span>
                          </div>

                          <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                            <span>
                              Verified:{" "}
                              <strong className="text-emerald-600 font-semibold">
                                {event.participantStats?.approvedAttendance || 0}
                              </strong>
                            </span>
                            {(event.participantStats?.pendingAttendance || 0) > 0 && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 font-semibold text-[10px]">
                                {event.participantStats?.pendingAttendance} pending
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleViewParticipants(event)}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium border border-border rounded-lg bg-background hover:bg-muted transition-colors gap-1 text-primary shadow-2xs whitespace-nowrap"
                          >
                            Manage Attendance &amp; Photos
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize whitespace-nowrap ${
                            event.status === "upcoming"
                              ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20"
                              : event.status === "ongoing"
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                                : event.status === "completed"
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                                  : "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20"
                          }`}
                        >
                          {event.status === "ongoing" && (
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                            </span>
                          )}
                          {event.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleEdit(event)}
                            className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Edit Event"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Complete Report */}
                          {event.status === "completed" && (
                            <button
                              onClick={() => handleOpenReport(event)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors"
                              title="Complete Event Report"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Cancel or Reactivate */}
                          <button
                            onClick={() => handleToggleCancel(event)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              event.status === "cancelled"
                                ? "text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                : "text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                            }`}
                            title={event.status === "cancelled" ? "Reactivate Event" : "Cancel Event"}
                          >
                            {event.status === "cancelled" ? (
                              <RotateCcw className="w-4 h-4" />
                            ) : (
                              <Ban className="w-4 h-4" />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(event._id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                            title="Delete Event"
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

            {/* Pagination */}
            {totalEvents > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-t border-border bg-muted/40">
                <div className="text-xs text-muted-foreground text-center sm:text-left">
                  Showing {(currentPage - 1) * eventsPerPage + 1}–
                  {Math.min(currentPage * eventsPerPage, totalEvents)} of {totalEvents} events
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg border border-border text-xs font-medium bg-background hover:bg-muted disabled:opacity-40 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-medium text-foreground px-1">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="px-3 py-1 rounded-lg border border-border text-xs font-medium bg-background hover:bg-muted disabled:opacity-40 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add/Edit Event Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-card rounded-2xl border border-border max-w-3xl w-full my-4 sm:my-6 flex flex-col max-h-[94vh] shadow-2xl">
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border sticky top-0 bg-card rounded-t-2xl z-10">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">
                    {editingEvent ? "Edit Event" : "Create New NSS Event"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Configure timings, venue location, and 50m geofenced attendance verification.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingEvent(null)
                    setError(null)
                  }}
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Title */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Event Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="e.g. Tree Plantation Drive 2026"
                      />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Description <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        className="w-full px-3.5 py-2 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="Provide details about the event, activities, objectives, and instructions..."
                      />
                    </div>

                    {/* Project */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Associated NSS Project <span className="text-red-500">*</span>
                      </label>
                      <select
                        required
                        value={formData.projectId}
                        onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      >
                        <option value="">Select a Project</option>
                        {projects.map((project) => (
                          <option key={project._id} value={project._id}>
                            {project.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Event Date */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Event Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.eventDate}
                        onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      />
                    </div>

                    {/* Start Time */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">Start Time</label>
                      <input
                        type="datetime-local"
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      />
                    </div>

                    {/* End Time */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">End Time</label>
                      <input
                        type="datetime-local"
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                      />
                    </div>

                    {/* Location & Geofencing Picker */}
                    <div className="md:col-span-2">
                      <EventLocationPicker
                        locationAddress={formData.location}
                        onChangeAddress={(val) => setFormData((prev) => ({ ...prev, location: val }))}
                        latitude={formData.locationLat}
                        onChangeLatitude={(val) => setFormData((prev) => ({ ...prev, locationLat: val }))}
                        longitude={formData.locationLng}
                        onChangeLongitude={(val) => setFormData((prev) => ({ ...prev, locationLng: val }))}
                        radius={formData.attendanceRadius}
                        onChangeRadius={(val) => setFormData((prev) => ({ ...prev, attendanceRadius: String(val) }))}
                      />
                    </div>

                    {/* Coordinator */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Event Coordinator Name
                      </label>
                      <input
                        type="text"
                        value={formData.coordinator}
                        onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="e.g. Prof. R. Sharma"
                      />
                    </div>

                    {/* Max Participants */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        Max Participants Capacity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.maxParticipants}
                        onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="Leave blank for unlimited"
                      />
                    </div>

                    {/* NSS Hours Awarded */}
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1.5">
                        NSS Hours Awarded
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={formData.nssHours}
                        onChange={(e) => setFormData({ ...formData, nssHours: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        placeholder="e.g. 3.0"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Credited to volunteers when attendance is verified.
                      </p>
                    </div>

                    {/* Attendance Extension (Super Admin) */}
                    {isSuperAdmin && (
                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">
                          Attendance Extension (Minutes)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.attendanceExtensionMinutes}
                          onChange={(e) => setFormData({ ...formData, attendanceExtensionMinutes: e.target.value })}
                          className="w-full px-3.5 py-2 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                          placeholder="0"
                        />
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Super Admin: Extra minutes allowed beyond event end time.
                        </p>
                      </div>
                    )}

                    {/* Status Automation Notice */}
                    <div className="md:col-span-2 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 text-xs text-blue-900 dark:text-blue-300">
                      <p className="font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Status Automation
                      </p>
                      <p className="mt-1 opacity-90 leading-relaxed">
                        Event status switches automatically between <strong>Upcoming</strong>, <strong>Ongoing</strong>,
                        and <strong>Completed</strong> based on the scheduled start and end times.
                      </p>
                    </div>
                  </div>
                </form>
              </div>

              <div className="flex items-center justify-end gap-2.5 p-3.5 sm:p-5 border-t border-border sticky bottom-0 bg-card rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingEvent(null)
                    setError(null)
                  }}
                  className="px-3.5 py-2 border border-border rounded-xl text-xs sm:text-sm font-medium hover:bg-muted transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="event-form"
                  disabled={submitting}
                  className="px-4 py-2 sm:px-5 sm:py-2 bg-primary text-primary-foreground rounded-xl text-xs sm:text-sm font-medium hover:bg-primary/90 transition-all flex items-center gap-2 disabled:opacity-50 shadow-sm"
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

        {/* Participants & Attendance Modal */}
        {showParticipantsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-card rounded-2xl border border-border max-w-5xl w-full max-h-[94vh] flex flex-col shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border">
                <div>
                  <p className="text-[11px] sm:text-xs font-semibold text-primary uppercase">Participant Attendance &amp; Photos</p>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground mt-0.5">
                    {participantsData?.event?.title || participantsEvent?.title || "Event"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Date:{" "}
                    {new Date(
                      participantsData?.event?.eventDate || participantsEvent?.eventDate,
                    ).toLocaleDateString()}{" "}
                    • Default Hours:{" "}
                    <strong className="text-primary font-bold">
                      {participantsData?.event?.nssHours || participantsEvent?.nssHours || 0}h
                    </strong>
                  </p>
                </div>
                <button
                  onClick={closeParticipantsModal}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Summary Stats Cards */}
              <div className="px-4 sm:px-5 pt-3.5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  <div className="bg-muted/40 border border-border rounded-xl p-2.5 sm:p-3">
                    <p className="text-[11px] text-muted-foreground mb-0.5">Total Registered</p>
                    <p className="text-xl sm:text-2xl font-bold text-foreground">
                      {participantsData?.summary?.registered || 0}
                    </p>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2.5 sm:p-3">
                    <p className="text-[11px] text-amber-700 dark:text-amber-300 mb-0.5 font-medium">Pending Approval</p>
                    <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {participantsData?.summary?.pendingAttendance || 0}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 sm:p-3">
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mb-0.5 font-medium">Verified Attendance</p>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {participantsData?.summary?.approvedAttendance || 0}
                    </p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 sm:p-3">
                    <p className="text-[11px] text-red-700 dark:text-red-300 mb-0.5 font-medium">Declined / Absent</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
                      {(participantsData?.summary?.declined || 0) + (participantsData?.summary?.rejectedAttendance || 0)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Search & Filter pills */}
              <div className="px-4 sm:px-5 pt-3 pb-2 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search volunteer by name or email..."
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                  {participantSearch && (
                    <button
                      onClick={() => setParticipantSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  {[
                    { id: "all", label: "All" },
                    { id: "pending", label: "Pending" },
                    { id: "approved", label: "Approved" },
                    { id: "with-photo", label: "With Photo" },
                    { id: "not-submitted", label: "Not Submitted" },
                  ].map((filterTab) => (
                    <button
                      key={filterTab.id}
                      onClick={() => setParticipantFilter(filterTab.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        participantFilter === filterTab.id
                          ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                          : "bg-muted/40 hover:bg-muted text-muted-foreground border border-border"
                      }`}
                    >
                      {filterTab.label}
                    </button>
                  ))}

                  {(participantsData?.summary?.pendingAttendance || 0) > 0 && (
                    <button
                      onClick={handleBulkApprove}
                      className="ml-auto px-3 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 shadow-xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve All Pending ({participantsData.summary.pendingAttendance})
                    </button>
                  )}
                </div>
              </div>

              {/* Table / List Body */}
              <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
                {participantsError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl text-xs">
                    {participantsError}
                  </div>
                )}

                {participantsLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : participantsData ? (
                  <>
                    {/* A. Mobile Participant Cards (block sm:hidden) */}
                    <div className="block sm:hidden space-y-2.5">
                      {filteredParticipants.length === 0 ? (
                        <p className="text-center py-8 text-xs text-muted-foreground">
                          No matching participants found.
                        </p>
                      ) : (
                        filteredParticipants.map((participant: any) => {
                          const photoUrl = participant.photo || participant.endPhoto || participant.startPhoto
                          return (
                            <div
                              key={participant.volunteerId}
                              className="bg-card border border-border rounded-xl p-3 space-y-2.5 shadow-2xs"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-foreground text-xs leading-snug truncate">
                                    {participant.name}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground truncate">{participant.email}</p>
                                </div>
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold capitalize shrink-0 ${
                                    participant.attendanceReviewStatus === "approved"
                                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                                      : participant.attendanceReviewStatus === "pending"
                                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                                        : participant.attendanceReviewStatus === "rejected"
                                          ? "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20"
                                          : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {participant.attendanceReviewStatus &&
                                  participant.attendanceReviewStatus !== "not-submitted"
                                    ? participant.attendanceReviewStatus === "pending"
                                      ? "Pending"
                                      : participant.attendanceReviewStatus
                                    : "Not Submitted"}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-border/50">
                                <span className="text-muted-foreground text-[11px]">
                                  Hours:{" "}
                                  <strong className="text-foreground font-mono">
                                    {participant.hoursWorked > 0
                                      ? `${participant.hoursWorked}h`
                                      : participant.pendingHours > 0
                                        ? `${participant.pendingHours}h (p)`
                                        : "0h"}
                                  </strong>
                                </span>

                                {photoUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => setPhotoModalParticipant(participant)}
                                    className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-muted/40 hover:bg-muted text-[11px] text-primary font-medium"
                                  >
                                    <Camera className="w-3.5 h-3.5" />
                                    View Photo
                                  </button>
                                ) : (
                                  <span className="text-muted-foreground text-[10px] italic">No photo</span>
                                )}

                                <button
                                  type="button"
                                  onClick={() => openEditAttendance(participant)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
                                >
                                  <Pencil className="w-3 h-3" />
                                  Edit
                                </button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>

                    {/* B. Desktop Full Table (hidden sm:block) */}
                    <div className="hidden sm:block overflow-x-auto border border-border rounded-xl">
                      <table className="w-full text-xs min-w-[700px]">
                        <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold uppercase text-[11px]">
                          <tr>
                            <th className="px-4 py-3 text-left">Volunteer</th>
                            <th className="px-4 py-3 text-left">Registration</th>
                            <th className="px-4 py-3 text-left">Attendance Status</th>
                            <th className="px-4 py-3 text-left">Photo Evidence</th>
                            <th className="px-4 py-3 text-left">NSS Hours</th>
                            <th className="px-4 py-3 text-left">Notes</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {filteredParticipants.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                No matching participants found.
                              </td>
                            </tr>
                          ) : (
                            filteredParticipants.map((participant: any) => {
                              const photoUrl = participant.photo || participant.endPhoto || participant.startPhoto

                              return (
                                <tr key={participant.volunteerId} className="hover:bg-muted/30 transition-colors">
                                  {/* Volunteer */}
                                  <td className="px-4 py-3 max-w-[180px]">
                                    <p className="font-semibold text-foreground truncate">{participant.name}</p>
                                    <p className="text-[11px] text-muted-foreground truncate">{participant.email}</p>
                                  </td>

                                  {/* Registration Status */}
                                  <td className="px-4 py-3 capitalize whitespace-nowrap">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                        participant.registrationStatus === "registered"
                                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                          : participant.registrationStatus === "declined"
                                            ? "bg-red-500/10 text-red-700 dark:text-red-300"
                                            : "bg-muted text-muted-foreground"
                                      }`}
                                    >
                                      {participant.registrationStatus?.replace("-", " ")}
                                    </span>
                                  </td>

                                  {/* Attendance Status */}
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                                        participant.attendanceReviewStatus === "approved"
                                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                                          : participant.attendanceReviewStatus === "pending"
                                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                                            : participant.attendanceReviewStatus === "rejected"
                                              ? "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20"
                                              : "bg-muted text-muted-foreground"
                                      }`}
                                    >
                                      {participant.attendanceReviewStatus === "approved" && (
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      )}
                                      {participant.attendanceReviewStatus === "pending" && (
                                        <Clock className="w-3 h-3 text-amber-600" />
                                      )}
                                      {participant.attendanceReviewStatus === "rejected" && (
                                        <XCircle className="w-3 h-3 text-red-600" />
                                      )}
                                      {participant.attendanceReviewStatus &&
                                      participant.attendanceReviewStatus !== "not-submitted"
                                        ? participant.attendanceReviewStatus === "pending"
                                          ? "Pending Review"
                                          : participant.attendanceReviewStatus
                                        : "Not Submitted"}
                                    </span>
                                  </td>

                                  {/* Photo */}
                                  <td className="px-4 py-3">
                                    {photoUrl ? (
                                      <button
                                        type="button"
                                        onClick={() => setPhotoModalParticipant(participant)}
                                        className="group flex items-center gap-1.5 p-1 rounded-lg border border-border bg-background hover:bg-muted/60 transition-colors text-left"
                                        title="Click to view full photo evidence"
                                      >
                                        <img
                                          src={photoUrl}
                                          alt="Thumbnail"
                                          className="w-8 h-8 object-cover rounded-md border border-border group-hover:scale-105 transition-transform shrink-0"
                                        />
                                        <span className="text-[11px] text-primary font-medium group-hover:underline flex items-center gap-0.5">
                                          <Camera className="w-3 h-3" />
                                          View
                                        </span>
                                      </button>
                                    ) : (
                                      <span className="text-muted-foreground text-[11px] italic">No photo</span>
                                    )}
                                  </td>

                                  {/* Hours */}
                                  <td className="px-4 py-3 font-mono font-medium whitespace-nowrap">
                                    {participant.hoursWorked > 0 ? (
                                      <span className="text-emerald-600 font-bold">{participant.hoursWorked}h</span>
                                    ) : participant.pendingHours > 0 ? (
                                      <span className="text-amber-600 font-semibold">
                                        {participant.pendingHours}h (pending)
                                      </span>
                                    ) : (
                                      <span className="text-muted-foreground">0h</span>
                                    )}
                                  </td>

                                  {/* Notes */}
                                  <td className="px-4 py-3 text-muted-foreground max-w-[140px] truncate">
                                    {participant.reviewNotes || "—"}
                                  </td>

                                  {/* Actions */}
                                  <td className="px-4 py-3 text-right whitespace-nowrap">
                                    <button
                                      type="button"
                                      onClick={() => openEditAttendance(participant)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors shadow-2xs"
                                    >
                                      <Pencil className="w-3 h-3" />
                                      Edit
                                    </button>
                                  </td>
                                </tr>
                              )
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">No participant records.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Photo Evidence Modal */}
        {photoModalParticipant && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-60 p-3 sm:p-4">
            <div className="bg-card rounded-2xl border border-border max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-primary" />
                    Attendance Photo: {photoModalParticipant.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">{photoModalParticipant.email}</p>
                </div>
                <button
                  onClick={() => setPhotoModalParticipant(null)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-muted/20 text-center">
                <div className="relative inline-block rounded-xl overflow-hidden border border-border shadow-md max-h-[55vh]">
                  <img
                    src={photoModalParticipant.photo || photoModalParticipant.endPhoto || photoModalParticipant.startPhoto}
                    alt={`Evidence of ${photoModalParticipant.name}`}
                    className="max-h-[55vh] w-auto object-contain mx-auto"
                  />
                </div>

                <div className="text-left text-xs bg-card border border-border rounded-xl p-3 space-y-1">
                  {photoModalParticipant.location?.address && (
                    <p className="text-muted-foreground flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>
                        <strong>Captured Location:</strong> {photoModalParticipant.location.address}
                      </span>
                    </p>
                  )}
                  {photoModalParticipant.location?.latitude && (
                    <p className="text-[11px] text-muted-foreground font-mono pl-4.5">
                      Coordinates: {photoModalParticipant.location.latitude.toFixed(5)},{" "}
                      {photoModalParticipant.location.longitude.toFixed(5)}
                    </p>
                  )}
                  <p className="text-muted-foreground pl-4.5 text-[11px]">
                    <strong>Status:</strong>{" "}
                    <span className="capitalize font-semibold text-foreground">
                      {photoModalParticipant.attendanceReviewStatus || "Not submitted"}
                    </span>{" "}
                    • Hours:{" "}
                    <span className="font-bold text-primary">
                      {photoModalParticipant.hoursWorked || photoModalParticipant.pendingHours || 0}h
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 border-t border-border bg-card">
                <a
                  href={photoModalParticipant.photo || photoModalParticipant.endPhoto || photoModalParticipant.startPhoto}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Full Resolution ↗
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const p = photoModalParticipant
                      setPhotoModalParticipant(null)
                      openEditAttendance(p)
                    }}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3" />
                    Edit Attendance
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoModalParticipant(null)}
                    className="px-3 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-muted"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Attendance Modal */}
        {editingParticipant && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-60 p-3 sm:p-4">
            <div className="bg-card rounded-2xl border border-border max-w-md w-full shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border bg-card">
                <div>
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <Pencil className="w-4 h-4 text-primary" />
                    Edit Attendance: {editingParticipant.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">{editingParticipant.email}</p>
                </div>
                <button
                  onClick={() => setEditingParticipant(null)}
                  className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[75vh]">
                {/* Photo Evidence Thumbnail in Edit Window */}
                {(editingParticipant.photo || editingParticipant.endPhoto || editingParticipant.startPhoto) && (
                  <div className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-muted/30">
                    <img
                      src={editingParticipant.photo || editingParticipant.endPhoto || editingParticipant.startPhoto}
                      alt="Proof"
                      className="w-12 h-12 sm:w-14 sm:h-14 object-cover rounded-lg border border-border shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                        <Camera className="w-3 h-3 text-primary" />
                        Uploaded Photo Evidence
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                        {editingParticipant.location?.address || "Location captured"}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const p = editingParticipant
                          setEditingParticipant(null)
                          setPhotoModalParticipant(p)
                        }}
                        className="text-[11px] text-primary hover:underline font-medium mt-1 inline-flex items-center gap-0.5"
                      >
                        Enlarge Photo <ExternalLink className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Status Dropdown */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">Attendance Status</label>
                  <select
                    value={editForm.reviewStatus}
                    onChange={(e) => {
                      const newStatus = e.target.value
                      setEditForm((prev) => ({
                        ...prev,
                        reviewStatus: newStatus,
                        hoursWorked:
                          newStatus === "approved"
                            ? prev.hoursWorked === "0"
                              ? (participantsEvent?.nssHours || participantsData?.event?.nssHours || 0).toString()
                              : prev.hoursWorked
                            : newStatus === "rejected"
                              ? "0"
                              : prev.hoursWorked,
                      }))
                    }}
                    className="w-full px-3 py-2 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none font-medium"
                  >
                    <option value="approved">Approved (Attended &amp; Verified)</option>
                    <option value="pending">Pending Review</option>
                    <option value="rejected">Rejected (Not Accepted / Absent)</option>
                    <option value="not-submitted">Reset / Not Submitted</option>
                  </select>
                </div>

                {/* NSS Hours Awarded */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-foreground">NSS Hours Awarded</label>
                    {participantsEvent?.nssHours && (
                      <button
                        type="button"
                        onClick={() =>
                          setEditForm((prev) => ({ ...prev, hoursWorked: participantsEvent.nssHours.toString() }))
                        }
                        className="text-[10px] text-primary hover:underline"
                      >
                        Reset to Event Hours ({participantsEvent.nssHours}h)
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={editForm.hoursWorked}
                      onChange={(e) => setEditForm({ ...editForm, hoursWorked: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent font-mono"
                      placeholder="e.g. 5.0"
                    />
                    <span className="text-xs text-muted-foreground font-semibold">hours</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Hours credited to volunteer profile when Approved.
                  </p>
                </div>

                {/* Review Notes */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Admin Review Notes <span className="text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.reviewNotes}
                    onChange={(e) => setEditForm({ ...editForm, reviewNotes: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    placeholder="e.g. Verified on site / Participated actively"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 p-3.5 sm:p-4 border-t border-border bg-card">
                <button
                  type="button"
                  onClick={() => setEditingParticipant(null)}
                  disabled={editSubmitting}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  disabled={editSubmitting}
                  className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:bg-primary/90 transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                >
                  {editSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save Attendance
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Event Report Modal */}
        {showReportModal && reportEvent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
            <div className="bg-card rounded-2xl border border-border max-w-3xl w-full my-4 sm:my-6 flex flex-col max-h-[92vh] shadow-2xl">
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border sticky top-0 bg-card rounded-t-2xl z-10">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">Event Report: {reportEvent.title}</h2>
                  <p className="text-xs text-muted-foreground">Document event outcomes, attendee counts, and photos.</p>
                </div>
                <button
                  onClick={() => {
                    setShowReportModal(false)
                    setReportEvent(null)
                    setReportError(null)
                  }}
                  className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4">
                {reportLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="animate-spin w-8 h-8 text-primary" />
                  </div>
                ) : (
                  <>
                    {reportError && (
                      <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 rounded-xl text-xs">
                        {reportError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-foreground mb-1.5">
                          Report Summary / Description
                        </label>
                        <textarea
                          rows={4}
                          value={reportForm.description}
                          onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                          className="w-full px-3.5 py-2 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                          placeholder="Describe the activities conducted, outcomes achieved, and community impact..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">Attendees Count</label>
                        <input
                          type="number"
                          min="0"
                          value={reportForm.attendeesCount}
                          onChange={(e) => setReportForm({ ...reportForm, attendeesCount: e.target.value })}
                          className="w-full px-3.5 py-2 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                          placeholder="e.g. 85"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-foreground mb-1.5">
                          Send Report To (Email)
                        </label>
                        <input
                          type="email"
                          value={reportForm.sendToEmail}
                          onChange={(e) => setReportForm({ ...reportForm, sendToEmail: e.target.value })}
                          className="w-full px-3.5 py-2 text-sm border border-border rounded-xl bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                          placeholder="nss-coordinator@university.edu"
                        />
                      </div>

                      {/* Photos */}
                      <div className="md:col-span-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-foreground">Photos (up to 10)</label>
                          <button
                            type="button"
                            onClick={() => {
                              if (reportForm.photoUrls.length < 10)
                                setReportForm({ ...reportForm, photoUrls: [...reportForm.photoUrls, ""] })
                            }}
                            className="text-xs text-primary font-medium hover:underline"
                          >
                            + Add Photo URL
                          </button>
                        </div>

                        {/* File upload */}
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
                                  setReportForm((prev) => ({
                                    ...prev,
                                    photoUrls: [...prev.photoUrls.filter(Boolean), data.url].slice(0, 10),
                                  }))
                                }
                              } catch {}
                            }
                            if (e.currentTarget) e.currentTarget.value = ""
                          }}
                          className="w-full text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
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
                                className="flex-1 px-3 py-1.5 text-xs border border-border rounded-lg bg-background"
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
                                title="Select for email report (max 4)"
                              />
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Check boxes on photos to include up to 4 images in the email report.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 p-3.5 sm:p-5 border-t border-border sticky bottom-0 bg-card rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(false)
                    setReportEvent(null)
                    setReportError(null)
                  }}
                  className="px-3.5 py-2 border border-border rounded-xl text-xs sm:text-sm font-medium hover:bg-muted transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
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
                        alert("Event report saved successfully!")
                      }
                    } catch {
                      setReportError("Failed to save report")
                    } finally {
                      setReportSubmitting(false)
                    }
                  }}
                  disabled={reportSubmitting}
                  className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs sm:text-sm font-medium hover:bg-primary/90 transition-all gap-1.5 disabled:opacity-50"
                >
                  {reportSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Report
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (!reportEvent || !reportForm.sendToEmail) {
                      setReportError("Please enter recipient email to send the report")
                      return
                    }
                    setReportSubmitting(true)
                    setReportError(null)
                    try {
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
                        body: JSON.stringify({
                          eventId: reportEvent._id,
                          email: reportForm.sendToEmail,
                        }),
                      })
                      const data = await res.json()
                      if (!data.success) {
                        setReportError(data.message || "Failed to send report email")
                      } else {
                        alert("Report email dispatched successfully!")
                        setShowReportModal(false)
                        setReportEvent(null)
                      }
                    } catch {
                      setReportError("Failed to send report email")
                    } finally {
                      setReportSubmitting(false)
                    }
                  }}
                  disabled={reportSubmitting}
                  className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-emerald-700 transition-all gap-1.5 disabled:opacity-50"
                >
                  {reportSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
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
