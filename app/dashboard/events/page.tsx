"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  MapPin,
  Camera,
  Clock,
  CheckCircle,
  PlayCircle,
  Loader2,
  ArrowLeft,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  UploadCloud,
  Sparkles,
  UserCheck,
  ShieldAlert,
  Search,
  Filter,
} from "lucide-react"
import Link from "next/link"
import { compressImage } from "@/lib/utils"

interface Event {
  _id: string
  title: string
  description: string
  eventDate: string
  location?: string
  startTime?: string
  endTime?: string
  status: string
  registrationStatus?: "registered" | "declined" | "pending"
  isDefaulter?: boolean
  locationCoordinates?: { latitude: number; longitude: number }
  attendanceRadius?: number
}

interface MyEvent {
  _id: string
  eventId: string
  eventTitle: string
  projectTitle: string
  status: string
  reviewStatus?: "pending" | "approved" | "rejected"
  reviewNotes?: string
  reviewedAt?: string
  startTime?: string
  endTime?: string
  startPhoto?: string
  endPhoto?: string
  hoursWorked: number
  pendingHours?: number
  workDescription?: string
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function EventsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [myEvents, setMyEvents] = useState<MyEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [action, setAction] = useState<"start" | "end" | "mark_attendance">("start")
  const [showModal, setShowModal] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [location, setLocation] = useState<{
    latitude: number
    longitude: number
    address: string
  } | null>(null)
  const [workDescription, setWorkDescription] = useState("")
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [registrationAction, setRegistrationAction] = useState<"register" | "decline">("register")
  const [declineReason, setDeclineReason] = useState("")
  const [registering, setRegistering] = useState(false)
  const [attendanceWindowMessage, setAttendanceWindowMessage] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalEvents, setTotalEvents] = useState(0)

  // UX & Tabs
  const [activeTab, setActiveTab] = useState<"available" | "my-claims">("available")
  const [searchQuery, setSearchQuery] = useState("")
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [modalMessage, setModalMessage] = useState<{
    type: "success" | "error" | "info"
    text: string
  } | null>(null)

  const eventsPerPage = 10

  useEffect(() => {
    if (status === "loading") return
    const user = session?.user as any
    if (!user) {
      router.replace("/login")
      return
    }
    fetchEvents(currentPage)
  }, [session, status, router, currentPage])

  const fetchEvents = async (page = currentPage) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/volunteer/events?page=${page}&limit=${eventsPerPage}`)
      const data = await res.json()
      if (data.success) {
        setEvents(data.events || [])
        setMyEvents(data.myEvents || [])
        setTotalPages(data.pagination?.pages || 1)
        setTotalEvents(data.pagination?.total || 0)
        if (page > (data.pagination?.pages || 1) && (data.pagination?.pages || 1) > 0) {
          setCurrentPage(data.pagination?.pages || 1)
        }
      }
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const getCurrentLocation = (): Promise<{
    latitude: number
    longitude: number
    address: string
  }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"))
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            )
            const data = await response.json()
            if (data.display_name) {
              address = data.display_name
            }
          } catch (e) {
            // fallback to coordinates
          }
          resolve({ latitude, longitude, address })
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      )
    })
  }

  const handlePhotoCapture = () => {
    setModalMessage(null)
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.capture = "environment"

    input.oncancel = () => {
      setUploadingPhoto(false)
    }

    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (file) {
        setUploadingPhoto(true)
        try {
          if (file.size > 20 * 1024 * 1024) {
            throw new Error("File size too large. Please upload an image smaller than 20MB.")
          }

          const compressedBlob = await compressImage(file, 0.7, 1024)
          const compressedFile = new File([compressedBlob], file.name, { type: "image/jpeg" })

          const formData = new FormData()
          formData.append("file", compressedFile)

          const res = await fetch("/api/upload/cloudinary", {
            method: "POST",
            body: formData,
          })

          const data = await res.json()
          if (data.success) {
            setPhoto(data.url)
            setModalMessage({ type: "success", text: "Photo uploaded successfully!" })
          } else {
            throw new Error(data.message || "Upload failed")
          }
        } catch (error: any) {
          console.error("Upload error:", error)
          setModalMessage({
            type: "error",
            text:
              error.message ||
              "Failed to upload photo. Please check your internet connection and try again.",
          })
        } finally {
          setUploadingPhoto(false)
        }
      }
    }
    input.click()
  }

  const handleStartEvent = async (eventId: string) => {
    setSelectedEvent(eventId)
    setAction("mark_attendance")
    setPhoto(null)
    setLocation(null)
    setModalMessage(null)
    setLocationLoading(true)
    setShowModal(true)

    try {
      const loc = await getCurrentLocation()
      setLocation(loc)
      setAttendanceWindowMessage("Mark your attendance by capturing a photo at the event location.")
    } catch (error: any) {
      console.error("Location error:", error)
      setModalMessage({
        type: "error",
        text: "Failed to get location. Please ensure GPS is enabled and browser permission is granted.",
      })
    } finally {
      setLocationLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedEvent || !photo || !location) {
      setModalMessage({
        type: "error",
        text: "Please capture photo and wait for location to be detected.",
      })
      return
    }

    setSubmitting(true)
    setModalMessage(null)

    try {
      const res = await fetch("/api/volunteer/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEvent,
          action,
          photo,
          location,
          workDescription: action === "end" ? workDescription : undefined,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        setPhoto(null)
        setLocation(null)
        setWorkDescription("")
        setAttendanceWindowMessage(null)
        fetchEvents()
      } else {
        setModalMessage({ type: "error", text: data.message || "Failed to update event" })
      }
    } catch (error) {
      setModalMessage({ type: "error", text: "Network error. Please try again." })
    } finally {
      setSubmitting(false)
    }
  }

  // Filter events by search query
  const filteredAvailableEvents = events.filter((ev) =>
    ev.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ev.location && ev.location.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  if (loading || status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin w-9 h-9 text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading Events...</p>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* ── Top Bar Navigation ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all w-fit shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>

        {myEvents.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">My Total Activities:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-xs">
              {myEvents.length} Recorded
            </span>
          </div>
        )}
      </div>

      {/* ── Page Header Banner ── */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-semibold">
              <Calendar className="w-3.5 h-3.5" />
              <span>NSS Community Service</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Events & Activity Participation
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Register for upcoming university drives, verify your live geo-attendance at event
              venues, and claim verified NSS service hours.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events or venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border">
          <button
            onClick={() => setActiveTab("available")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "available"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Available Events ({events.length})
          </button>
          <button
            onClick={() => setActiveTab("my-claims")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "my-claims"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            My Activity History ({myEvents.length})
          </button>
        </div>
      </div>

      {/* ── TAB 1: Available Events ── */}
      {activeTab === "available" && (
        <div className="space-y-4">
          {filteredAvailableEvents.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-8 sm:p-12 text-center shadow-xs">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-bold text-foreground mb-1">No Events Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {searchQuery
                  ? "No events match your search query. Try clearing the filter."
                  : "There are currently no active events open for registration. Please check back later."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAvailableEvents.map((event) => {
                const myEvent = myEvents.find((e) => e.eventId === event._id)
                const evDate = new Date(event.eventDate)

                return (
                  <div
                    key={event._id}
                    className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    <div>
                      {/* Top Row: Date Pill & Status */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        {/* Calendar Date Block */}
                        <div className="w-13 h-13 rounded-xl bg-primary/10 text-primary flex flex-col items-center justify-center shrink-0 border border-primary/20">
                          <span className="text-[10px] font-bold uppercase leading-none">
                            {evDate.toLocaleDateString("en-IN", { month: "short" })}
                          </span>
                          <span className="text-lg font-extrabold leading-tight">
                            {evDate.getDate()}
                          </span>
                        </div>

                        {/* Status Pills */}
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {event.isDefaulter && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                              <ShieldAlert className="w-3 h-3" />
                              <span>Defaulter</span>
                            </span>
                          )}

                          {myEvent ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                                myEvent.status === "completed"
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                  : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
                              }`}
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>{myEvent.status === "completed" ? "Attended" : "Registered"}</span>
                            </span>
                          ) : event.registrationStatus === "registered" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                              <CheckCircle className="w-3 h-3" /> Registered
                            </span>
                          ) : event.registrationStatus === "declined" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                              Declined
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
                              Registration Open
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-bold text-base sm:text-lg text-foreground mb-1 leading-snug">
                        {event.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                        {event.description}
                      </p>

                      {/* Metadata Chips */}
                      <div className="space-y-1.5 pt-2 border-t border-border/60 text-xs">
                        {event.location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>
                            {event.startTime
                              ? `${new Date(event.startTime).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}`
                              : "Time TBA"}{" "}
                            {event.endTime &&
                              `to ${new Date(event.endTime).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="pt-3 border-t border-border/60">
                      {event.registrationStatus === "pending" && !myEvent ? (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setSelectedEvent(event._id)
                              setRegistrationAction("register")
                              setShowRegistrationModal(true)
                            }}
                            className="w-full py-2.5 px-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Register</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEvent(event._id)
                              setRegistrationAction("decline")
                              setDeclineReason("")
                              setShowRegistrationModal(true)
                            }}
                            className="w-full py-2.5 px-3 rounded-xl border border-border bg-muted/40 hover:bg-muted font-medium text-xs text-foreground transition-all"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (event.registrationStatus === "registered" || !event.registrationStatus) &&
                        !myEvent ? (
                        <button
                          onClick={() => handleStartEvent(event._id)}
                          className="w-full py-2.5 px-3 rounded-xl bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Mark Live Attendance</span>
                        </button>
                      ) : myEvent && myEvent.status === "started" ? (
                        <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center justify-center gap-1.5">
                          <CheckCircle className="w-4 h-4" />
                          <span>Attendance Submitted</span>
                        </div>
                      ) : myEvent && myEvent.status === "completed" ? (
                        <div className="w-full py-2 px-3 rounded-xl bg-muted text-muted-foreground text-xs font-medium flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Completed & Verified</span>
                        </div>
                      ) : (
                        <div className="w-full py-2 px-3 rounded-xl bg-muted text-muted-foreground text-xs text-center">
                          Registration Closed
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground">
                Showing {(currentPage - 1) * eventsPerPage + 1} to{" "}
                {Math.min(currentPage * eventsPerPage, totalEvents)} of {totalEvents} events
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-border rounded-xl text-xs font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </button>
                <span className="text-xs px-2 font-semibold">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-border rounded-xl text-xs font-medium hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: My Activity History (Attended Events) ── */}
      {activeTab === "my-claims" && (
        <div className="space-y-4">
          {myEvents.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-8 sm:p-12 text-center shadow-xs">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-bold text-foreground mb-1">No Activity History Yet</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                You haven't marked attendance for any NSS events yet. Check the Available Events tab
                to participate!
              </p>
              <button
                onClick={() => setActiveTab("available")}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
              >
                Browse Events
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myEvents.map((event) => (
                <div
                  key={event._id}
                  className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-base text-foreground truncate">
                          {event.eventTitle}
                        </h3>
                        {event.projectTitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            Project: {event.projectTitle}
                          </p>
                        )}
                      </div>

                      {/* Review Badge */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border shrink-0 ${
                          event.reviewStatus === "approved"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                            : event.reviewStatus === "rejected"
                              ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {event.reviewStatus === "approved"
                          ? "Approved"
                          : event.reviewStatus === "rejected"
                            ? "Rejected"
                            : "Under Review"}
                      </span>
                    </div>

                    {/* Hours Info Banner */}
                    <div className="my-2 p-2.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Service Hours:</span>
                      <span className="font-bold text-foreground">
                        {event.reviewStatus === "approved" && event.hoursWorked > 0
                          ? `${event.hoursWorked} hrs (Verified)`
                          : event.reviewStatus === "pending"
                            ? `${event.pendingHours || 0} hrs (Pending)`
                            : "0 hrs"}
                      </span>
                    </div>

                    {/* Work description */}
                    {event.workDescription && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        "{event.workDescription}"
                      </p>
                    )}

                    {/* Photos Preview */}
                    {(event.startPhoto || event.endPhoto) && (
                      <div className="mt-3 pt-3 border-t border-border/60">
                        <span className="text-[11px] font-semibold text-muted-foreground block mb-1.5">
                          Attendance Photos:
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {event.startPhoto && (
                            <img
                              src={event.startPhoto}
                              alt="Start Photo"
                              className="w-full h-24 object-cover rounded-xl border border-border"
                            />
                          )}
                          {event.endPhoto && (
                            <img
                              src={event.endPhoto}
                              alt="End Photo"
                              className="w-full h-24 object-cover rounded-xl border border-border"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-muted-foreground pt-2 border-t border-border/40 flex items-center justify-between">
                    <span>
                      {event.startTime &&
                        new Date(event.startTime).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                    </span>
                    <span className="capitalize text-primary font-medium">{event.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Attendance Modal (Mobile & Desktop) ── */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in">
          <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-primary" />
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Mark Event Attendance
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedEvent(null)
                  setPhoto(null)
                  setLocation(null)
                  setWorkDescription("")
                  setModalMessage(null)
                }}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  modalMessage.type === "error"
                    ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{modalMessage.text}</p>
              </div>
            )}

            {/* Step 1: Location Verification */}
            <div className="bg-muted/30 rounded-xl p-3.5 border border-border/60 space-y-2">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" /> GPS Location Status
              </span>

              {locationLoading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Detecting your venue coordinates...</span>
                </div>
              ) : location ? (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> GPS Coordinates Acquired
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{location.address}</p>

                  {/* Geofence check */}
                  {(() => {
                    const curEvent = events.find((e) => e._id === selectedEvent)
                    if (
                      curEvent?.locationCoordinates?.latitude &&
                      curEvent?.locationCoordinates?.longitude
                    ) {
                      const dist = Math.round(
                        calculateDistance(
                          curEvent.locationCoordinates.latitude,
                          curEvent.locationCoordinates.longitude,
                          location.latitude,
                          location.longitude,
                        ),
                      )
                      const maxRadius = curEvent.attendanceRadius || 50
                      const isInside = dist <= maxRadius
                      return (
                        <div
                          className={`p-2 rounded-lg text-xs font-medium flex items-start gap-2 ${
                            isInside
                              ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-800 border border-amber-500/20"
                          }`}
                        >
                          <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">
                              {isInside ? "Inside Event Venue" : "Outside Allowed Geofence"}
                            </span>
                            <p className="text-[11px] opacity-90 mt-0.5">
                              Distance: <span className="font-mono font-bold">{dist}m</span> (Max:{" "}
                              {maxRadius}m)
                            </p>
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
              ) : (
                <div className="text-xs text-rose-600">
                  <span>Location not detected.</span>
                  <button
                    onClick={async () => {
                      setLocationLoading(true)
                      try {
                        const loc = await getCurrentLocation()
                        setLocation(loc)
                      } catch (e) {
                        setModalMessage({ type: "error", text: "Retry failed. Please check GPS." })
                      } finally {
                        setLocationLoading(false)
                      }
                    }}
                    className="ml-2 text-primary font-bold hover:underline"
                  >
                    Retry GPS
                  </button>
                </div>
              )}
            </div>

            {/* Step 2: Photo Upload / Capture */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-foreground block">
                Attendance Selfie / Venue Photo *
              </span>

              {uploadingPhoto ? (
                <div className="w-full h-40 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center bg-muted/20 gap-2">
                  <Loader2 className="w-7 h-7 text-primary animate-spin" />
                  <span className="text-xs font-semibold text-foreground">
                    Uploading & Compressing...
                  </span>
                </div>
              ) : photo ? (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  <img src={photo} alt="Selfie" className="w-full h-44 object-cover" />
                  <button
                    onClick={() => setPhoto(null)}
                    className="absolute top-2 right-2 p-1.5 bg-rose-600 text-white rounded-full shadow-md hover:scale-105 transition-transform"
                    title="Retake photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handlePhotoCapture}
                  disabled={locationLoading}
                  className="w-full py-6 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center hover:bg-muted/40 transition-colors gap-2"
                >
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    <Camera className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-foreground">Capture Attendance Photo</span>
                  <span className="text-[11px] text-muted-foreground">Tap to open phone camera</span>
                </button>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2 border-t border-border">
              <button
                onClick={() => {
                  setShowModal(false)
                  setPhoto(null)
                  setLocation(null)
                  setModalMessage(null)
                }}
                disabled={submitting || uploadingPhoto}
                className="flex-1 py-2.5 px-4 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!photo || !location || submitting || uploadingPhoto || locationLoading}
                className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-xs"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm Attendance</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Registration / Decline Modal ── */}
      {showRegistrationModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in">
          <div className="bg-card rounded-2xl border border-border p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h2 className="text-base sm:text-lg font-bold text-foreground">
                {registrationAction === "register" ? "Confirm Registration" : "Decline Event"}
              </h2>
              <button
                onClick={() => {
                  setShowRegistrationModal(false)
                  setSelectedEvent(null)
                  setDeclineReason("")
                }}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {registrationAction === "register" ? (
              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  By registering, you commit to attending this NSS drive. Failing to mark attendance
                  without informing may mark your record as a defaulter.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowRegistrationModal(false)
                      setSelectedEvent(null)
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!selectedEvent) return
                      setRegistering(true)
                      try {
                        const res = await fetch("/api/volunteer/event-registration", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            eventId: selectedEvent,
                            action: "register",
                          }),
                        })
                        const data = await res.json()
                        if (data.success) {
                          setShowRegistrationModal(false)
                          setSelectedEvent(null)
                          fetchEvents()
                        } else {
                          alert(data.message || "Failed to register")
                        }
                      } catch (err) {
                        alert("Error registering for event")
                      } finally {
                        setRegistering(false)
                      }
                    }}
                    disabled={registering}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    {registering ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Confirm Registration"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Please provide a reason for declining. This is recorded for your Unit Program
                  Officer to review.
                </p>
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">
                    Reason for Declining *
                  </label>
                  <textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Enter valid reason (e.g., class conflict, exam, illness)..."
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowRegistrationModal(false)
                      setSelectedEvent(null)
                      setDeclineReason("")
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      if (!selectedEvent || !declineReason.trim()) {
                        alert("Please provide a reason")
                        return
                      }
                      setRegistering(true)
                      try {
                        const res = await fetch("/api/volunteer/event-registration", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            eventId: selectedEvent,
                            action: "decline",
                            reason: declineReason,
                          }),
                        })
                        const data = await res.json()
                        if (data.success) {
                          setShowRegistrationModal(false)
                          setSelectedEvent(null)
                          setDeclineReason("")
                          fetchEvents()
                        } else {
                          alert(data.message || "Failed to decline event")
                        }
                      } catch (err) {
                        alert("Error declining event")
                      } finally {
                        setRegistering(false)
                      }
                    }}
                    disabled={registering || !declineReason.trim()}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Reason"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
