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
} from "lucide-react"
import Link from "next/link"

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
  startTime?: string
  endTime?: string
  startPhoto?: string
  endPhoto?: string
  hoursWorked: number
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

  useEffect(() => {
    if (status === "loading") return
    const user = session?.user as any
    if (!user) {
      router.replace("/login")
      return
    }
    fetchEvents()
  }, [session, status, router])

  const fetchEvents = async () => {
    try {
      const res = await fetch("/api/volunteer/events")
      const data = await res.json()
      if (data.success) {
        setEvents(data.events || [])
        setMyEvents(data.myEvents || [])
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
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.capture = "environment"
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (file) {
        try {
          const formData = new FormData()
          formData.append("file", file)

          const res = await fetch("/api/upload/cloudinary", {
            method: "POST",
            body: formData,
          })

          const data = await res.json()
          if (data.success) {
            setPhoto(data.url)
          }
        } catch (error) {
          alert("Failed to upload photo")
        }
      }
    }
    input.click()
  }

  const handleStartEvent = async (eventId: string) => {
    setSelectedEvent(eventId)
    setAction("start")
    setPhoto(null)
    setLocation(null)

    try {
      const loc = await getCurrentLocation()
      setLocation(loc)
      setShowModal(true)
    } catch (error) {
      alert("Failed to get location. Please enable location services.")
    }
  }

  const handleEndEvent = async (eventId: string) => {
    setSelectedEvent(eventId)
    setAction("end")
    setPhoto(null)
    setLocation(null)

    try {
      const loc = await getCurrentLocation()
      setLocation(loc)
      setShowModal(true)
    } catch (error) {
      alert("Failed to get location. Please enable location services.")
    }
  }

  const handleSubmit = async () => {
    if (!selectedEvent || !photo || !location) {
      alert("Please capture photo and ensure location is available")
      return
    }

    setSubmitting(true)
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
        fetchEvents()
      } else {
        alert(data.message || "Failed to update event")
      }
    } catch (error) {
      alert("Error updating event")
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
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <Calendar className="w-8 h-8 mr-3 text-primary" />
          Events
        </h1>
        <p className="text-muted-foreground mt-2">Participate in NSS events and track your attendance</p>
      </div>

      {/* My Events */}
      {myEvents.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">My Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myEvents.map((event) => (
              <div key={event._id} className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{event.eventTitle}</h3>
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

                {event.hoursWorked > 0 && (
                  <div className="flex items-center text-sm text-foreground mb-2">
                    <Clock className="w-4 h-4 mr-2" />
                    Hours Worked: {event.hoursWorked}h
                  </div>
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
        <h2 className="text-xl font-semibold text-foreground mb-4">Available Events</h2>
        {events.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Events Available</h3>
            <p className="text-muted-foreground">There are no events for your project at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => {
              const myEvent = myEvents.find((e) => e.eventId === event._id)
              return (
                <div key={event._id} className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{event.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
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
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Start Event
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
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Start Event
                    </button>
                  ) : myEvent && myEvent.status === "started" ? (
                    <button
                      onClick={() => handleEndEvent(event._id)}
                      className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      End Event
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
      </div>

      {/* Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {action === "start" ? "Start Event" : "End Event"}
            </h2>

            <div className="space-y-4">
              {location && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm font-medium text-foreground mb-1">Location:</p>
                  <p className="text-sm text-muted-foreground">{location.address}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {action === "start" ? "Start Photo" : "End Photo"} *
                </label>
                {photo ? (
                  <div className="relative">
                    <img src={photo} alt="Event photo" className="w-full h-48 object-cover rounded-lg" />
                    <button
                      onClick={() => setPhoto(null)}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handlePhotoCapture}
                    className="w-full flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Capture Photo</span>
                  </button>
                )}
              </div>

              {action === "end" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Work Description</label>
                  <textarea
                    value={workDescription}
                    onChange={(e) => setWorkDescription(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground"
                    placeholder="Describe the work done..."
                  />
                </div>
              )}

              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setPhoto(null)
                    setLocation(null)
                  }}
                  className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!photo || !location || submitting}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin w-4 h-4 mr-2 inline" />
                      Submitting...
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-foreground mb-4">
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

