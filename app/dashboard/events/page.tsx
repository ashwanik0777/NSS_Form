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
  UploadCloud,
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

export default function EventsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [myEvents, setMyEvents] = useState<MyEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [action, setAction] = useState<"start" | "end">("start")
  const [showModal, setShowModal] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(
    null
  )
  const [workDescription, setWorkDescription] = useState("")
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [registrationAction, setRegistrationAction] = useState<"register" | "decline">("register")
  const [declineReason, setDeclineReason] = useState("")
  const [registering, setRegistering] = useState(false)
  const [attendanceWindowMessage, setAttendanceWindowMessage] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalEvents, setTotalEvents] = useState(0)
  
  // New states for better UX
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [modalMessage, setModalMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null)
  
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

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number; address: string }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"))
        return
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          // Try to get address from coordinates (simple reverse geocoding)
          let address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
            )
            const data = await response.json()
            if (data.display_name) {
              address = data.display_name
            }
          } catch (e) {
            // Use coordinates if reverse geocoding fails
          }
          resolve({ latitude, longitude, address })
        },
        (error) => reject(error)
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
          // Check file size (limit to 20MB before compression)
          if (file.size > 20 * 1024 * 1024) {
             throw new Error("File size too large. Please upload an image smaller than 20MB.")
          }

          // Compress image
          const compressedBlob = await compressImage(file, 0.7, 1024);
          const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' });

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
              text: error.message || "Failed to upload photo. Please check your internet connection and try again." 
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
    setShowModal(true) // Show modal immediately so loading state is visible

    try {
      const loc = await getCurrentLocation()
      setLocation(loc)
      setAttendanceWindowMessage(
        "Mark your attendance by capturing a photo at the event location.",
      )
    } catch (error: any) {
      console.error("Location error:", error)
      setModalMessage({ 
          type: "error", 
          text: "Failed to get location. Please ensure GPS is enabled and browser permission is granted." 
      })
    } finally {
        setLocationLoading(false)
    }
  }

  // End event handler removed as requested - Single photo attendance flow

  const handleSubmit = async () => {
    if (!selectedEvent || !photo || !location) {
      setModalMessage({ type: "error", text: "Please capture photo and wait for location to be detected." })
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

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-5 md:p-6 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2 sm:gap-3">
          <Calendar className="w-7 h-7 sm:w-8 sm:h-8 text-primary shrink-0" />
          <span>Events</span>
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2">Participate in NSS events and track your attendance</p>
      </div>

      {/* My Events */}
      {myEvents.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">My Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {myEvents.map((event) => (
              <div key={event._id} className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base sm:text-lg text-foreground truncate">{event.eventTitle}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{event.projectTitle}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
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
                    {event.status === "completed" && event.reviewStatus && (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          event.reviewStatus === "approved"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : event.reviewStatus === "rejected"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }`}
                      >
                        {event.reviewStatus === "approved"
                          ? "Approved"
                          : event.reviewStatus === "rejected"
                            ? "Rejected"
                            : "Under Review"}
                      </span>
                    )}
                  </div>
                </div>

                {event.startTime && (
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <Clock className="w-4 h-4 mr-2" />
                    Started: {new Date(event.startTime).toLocaleString()}
                  </div>
                )}

                {event.endTime && (
                  <div className="flex items-center text-sm text-muted-foreground mb-2">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Ended: {new Date(event.endTime).toLocaleString()}
                  </div>
                )}

                {event.status === "completed" && (
                  <div className="flex items-center text-sm text-foreground mb-2">
                    <Clock className="w-4 h-4 mr-2" />
                    {event.reviewStatus === "approved" && event.hoursWorked > 0
                      ? `Approved Hours: ${event.hoursWorked}h`
                      : event.reviewStatus === "pending"
                        ? `Pending Approval: ${event.pendingHours || 0}h eligible`
                        : event.reviewStatus === "rejected"
                          ? `Rejected${event.reviewNotes ? `: ${event.reviewNotes}` : ""}`
                          : `Hours: ${event.hoursWorked || 0}h`}
                  </div>
                )}

                {event.status === "completed" && event.reviewStatus === "pending" && (
                  <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-3">
                    Attendance submitted and awaiting admin approval.
                  </p>
                )}
                {event.status === "completed" && event.reviewStatus === "rejected" && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                    {event.reviewNotes ? event.reviewNotes : "Attendance rejected by admin."}
                  </p>
                )}

                {event.workDescription && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-1">Work Description:</p>
                    <p className="text-sm text-foreground">{event.workDescription}</p>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  {event.startPhoto && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Start Photo</p>
                      <img src={event.startPhoto} alt="Start" className="w-full h-24 object-cover rounded-lg" />
                    </div>
                  )}
                  {event.endPhoto && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">End Photo</p>
                      <img src={event.endPhoto} alt="End" className="w-full h-24 object-cover rounded-lg" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Events */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-3 sm:mb-4">Available Events</h2>
        {events.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-8 sm:p-12 text-center">
            <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">No Events Available</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">There are no events available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {events.map((event) => {
              const myEvent = myEvents.find((e) => e.eventId === event._id)
              return (
                <div key={event._id} className="bg-card rounded-xl border border-border p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg text-foreground">{event.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{event.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {event.location && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-2" />
                        {event.location}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(event.eventDate).toLocaleDateString()}
                    </div>
                  </div>

                  {event.registrationStatus === "pending" && !myEvent && (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setSelectedEvent(event._id)
                          setRegistrationAction("register")
                          setShowRegistrationModal(true)
                        }}
                        className="w-full flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Register for Event
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEvent(event._id)
                          setRegistrationAction("decline")
                          setDeclineReason("")
                          setShowRegistrationModal(true)
                        }}
                        className="w-full flex items-center justify-center px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                      >
                        Decline (Provide Reason)
                      </button>
                      {event.isDefaulter && (
                        <p className="text-xs text-red-600 text-center">⚠️ You are marked as defaulter for this event</p>
                      )}
                    </div>
                  )}
                  {event.registrationStatus === "registered" && !myEvent && (
                    <button
                      onClick={() => handleStartEvent(event._id)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Attendance
                    </button>
                  )}
                  {event.registrationStatus === "declined" && !myEvent && (
                    <div className="w-full flex items-center justify-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                      Event Declined
                    </div>
                  )}
                  {!event.registrationStatus && !myEvent ? (
                    <button
                      onClick={() => handleStartEvent(event._id)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Attendance
                    </button>
                  ) : myEvent && myEvent.status === "started" ? (
                    <button
                        disabled
                        className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors opacity-90 cursor-default"
                        >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Attendance Marked
                    </button>
                  ) : (
                    <div className="w-full flex items-center justify-center px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Completed
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * eventsPerPage) + 1} to {Math.min(currentPage * eventsPerPage, totalEvents)} of {totalEvents} events
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 border rounded-lg transition-colors ${
                        currentPage === pageNum
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 max-w-md w-full max-h-[92vh] overflow-y-auto shadow-2xl">
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4">
              Mark Attendance
            </h2>

            {modalMessage && (
               <div className={`mb-4 p-3 rounded-lg flex items-start gap-2 text-sm ${
                   modalMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 
                   modalMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
                   'bg-blue-50 text-blue-700 border border-blue-200'
               }`}>
                   <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                   <p>{modalMessage.text}</p>
               </div>
            )}

            <div className="space-y-4">
              {/* Location Section */}
              <div className="bg-muted/30 rounded-lg p-4 border border-border">
                  <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" /> Location Status
                  </p>
                  
                  {locationLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Detecting your location...</span>
                      </div>
                  ) : location ? (
                      <div>
                          <p className="text-xs text-green-600 font-medium flex items-center gap-1 mb-1">
                              <CheckCircle className="w-3 h-3" /> Location Verified
                          </p>
                          <p className="text-xs text-muted-foreground break-words">{location.address}</p>
                      </div>
                  ) : (
                      <div className="text-sm text-red-500">
                          <p>Location needed.</p>
                          <button 
                             onClick={async () => {
                                 setLocationLoading(true)
                                 try {
                                     const loc = await getCurrentLocation()
                                     setLocation(loc)
                                 } catch(e) {
                                     setModalMessage({ type: 'error', text: 'Retry failed. Check GPS.'})
                                 } finally {
                                     setLocationLoading(false)
                                 }
                             }}
                             className="text-primary hover:underline text-xs mt-1"
                          >
                              Try Again
                          </button>
                      </div>
                  )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Attendance Photo *
                </label>
                
                {uploadingPhoto ? (
                    <div className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center bg-muted/20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
                        <span className="text-sm font-medium text-foreground">Uploading & Compressing...</span>
                        <span className="text-xs text-muted-foreground mt-1">Please wait, do not close.</span>
                    </div>
                ) : photo ? (
                  <div className="relative">
                    <img src={photo} alt="Event photo" className="w-full h-48 object-cover rounded-lg border border-border" />
                    <button
                      onClick={() => setPhoto(null)}
                      className="absolute top-2 right-2 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-transform hover:scale-105"
                      title="Retake photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Uploaded
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handlePhotoCapture}
                    disabled={locationLoading}
                    className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg hover:bg-muted/50 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="p-3 bg-primary/10 rounded-full mb-3 group-hover:scale-110 transition-transform">
                        <Camera className="w-6 h-6 text-primary" />
                    </div>
                    <span className="text-sm font-medium text-foreground">Tap to Capture Photo</span>
                    <span className="text-xs text-muted-foreground mt-1">Camera will open automatically</span>
                  </button>
                )}
              </div>

              <div className="flex space-x-4 pt-2">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setPhoto(null)
                    setLocation(null)
                    setModalMessage(null)
                  }}
                  disabled={submitting || uploadingPhoto}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!photo || !location || submitting || uploadingPhoto || locationLoading}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4" />
                      Submitting...
                    </>
                  ) : (
                    <>
                        <CheckCircle className="w-4 h-4" />
                        Submit Attendance
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-3 sm:mb-4">
              {registrationAction === "register" ? "Register for Event" : "Decline Event"}
            </h2>

            {registrationAction === "register" ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  By registering, you confirm that you will attend this event. If you fail to attend or mark your attendance, 
                  you will be added to the defaulter list.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setShowRegistrationModal(false)
                      setSelectedEvent(null)
                    }}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
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
                      } catch (error) {
                        alert("Error registering for event")
                      } finally {
                        setRegistering(false)
                      }
                    }}
                    disabled={registering}
                    className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {registering ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4 mr-2 inline" />
                        Registering...
                      </>
                    ) : (
                      "Confirm Registration"
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Please provide a reason for declining this event. If you don't register and don't provide a reason, 
                  you will be added to the defaulter list.
                </p>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Reason for Declining *</label>
                  <textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground"
                    placeholder="Please provide a reason for not attending this event..."
                    required
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      setShowRegistrationModal(false)
                      setSelectedEvent(null)
                      setDeclineReason("")
                    }}
                    className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
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
                      } catch (error) {
                        alert("Error declining event")
                      } finally {
                        setRegistering(false)
                      }
                    }}
                    disabled={registering || !declineReason.trim()}
                    className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                  >
                    {registering ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4 mr-2 inline" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Reason"
                    )}
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

