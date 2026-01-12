"use client"

import { useState, useEffect } from "react"
import { Search, Save, Loader2, AlertCircle, Calendar, Clock, User, CheckCircle2 } from "lucide-react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import AdminHeader from "@/components/admin/AdminHeader"
import { useRouter } from "next/navigation"

export default function ManualAttendancePage() {
  const router = useRouter()
  // Search State
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  
  // Selection State
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null)
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [selectedEventId, setSelectedEventId] = useState("")
  const [eventsLoading, setEventsLoading] = useState(true)
  
  // Form State
  const [hours, setHours] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Fetch Events on Mount
  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    setEventsLoading(true)
    try {
      const res = await fetch("/api/admin/events?limit=100")
      if (!res.ok) throw new Error("Failed to fetch events")
      const data = await res.json()
      if (data.events) {
        setRecentEvents(data.events)
      }
    } catch (error) {
      console.error("Error fetching events:", error)
      setMessage({ type: "error", text: "Could not load events list. Please refresh." })
    } finally {
      setEventsLoading(false)
    }
  }

  // Handle Search Debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearch()
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const handleSearch = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users/search-volunteers?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (data.success) {
        setSearchResults(data.volunteers || [])
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleVolunteerSelect = (volunteer: any) => {
    setSelectedVolunteer(volunteer)
    setSearchQuery("") // Clear search
    setSearchResults([]) // Clear results
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVolunteer || !selectedEventId || !hours) {
      setMessage({ type: "error", text: "Please select volunteer, event, and enter hours" })
      return
    }

    setSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch("/api/admin/attendance/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volunteerId: selectedVolunteer._id,
          eventId: selectedEventId,
          hours: Number(hours),
          description
        }),
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: "success", text: "Attendance marked successfully!" })
        // Reset form but keep event likely? Or reset all? User might want to batch add for same event
        setSelectedVolunteer(null) 
        setHours("")
        setDescription("")
       // setRequestAnimationFrame to scroll to top?
      } else {
        setMessage({ type: "error", text: data.message || "Failed to mark attendance" })
      }
    } catch (error) {
      console.error("Submit error:", error)
      setMessage({ type: "error", text: "Failed to submit attendance" })
    } finally {
      setSubmitting(false)
    }
  }

  // Helper to format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A"
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  return (
    <ProtectedRoute requiredRole="sub-admin" requiredPermission="events.manage">
      <AdminHeader title="Manual Attendance" subtitle="Mark attendance for missed volunteers in past events" />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        
        {message && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <p>{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left Column: Volunteer Selection */}
            <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-full">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        Step 1: Select Volunteer
                    </h3>

                    {!selectedVolunteer ? (
                        <div className="space-y-4">
                             <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <input
                                type="text"
                                placeholder="Search volunteer name, email..."
                                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {loading && <div className="text-center py-4"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>}

                            {!loading && searchResults.length > 0 && (
                                <div className="border border-border rounded-lg divide-y divide-border max-h-60 overflow-y-auto">
                                    {searchResults.map(vol => (
                                        <button
                                            key={vol._id}
                                            onClick={() => handleVolunteerSelect(vol)}
                                            className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors flex flex-col"
                                        >
                                            <span className="font-medium">{vol.name}</span>
                                            <span className="text-xs text-muted-foreground">{vol.email}</span>
                                            {vol.application?.institutionalIdCard && <span className="text-xs text-muted-foreground">ID: {vol.application.institutionalIdCard}</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                             {!loading && searchQuery.length >= 2 && searchResults.length === 0 && (
                                <p className="text-center text-muted-foreground text-sm py-2">No volunteers found</p>
                            )}
                        </div>
                    ) : (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 relative">
                            <button 
                                onClick={() => setSelectedVolunteer(null)}
                                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                            >
                                Change
                            </button>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {selectedVolunteer.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-semibold">{selectedVolunteer.name}</h4>
                                    <p className="text-xs text-muted-foreground">{selectedVolunteer.email}</p>
                                </div>
                            </div>
                            {selectedVolunteer.application && (
                                <div className="text-xs grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-primary/10">
                                    <span>Unit: {selectedVolunteer.application.unitNo || 'N/A'}</span>
                                    <span>Enrollment: {selectedVolunteer.application.institutionalIdCard || 'N/A'}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Column: Event & Details */}
            <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 shadow-sm h-full">
                     <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        Step 2: Event & Details
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">Select Event</label>
                            <select
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                required
                                disabled={eventsLoading}
                            >
                                <option value="">{eventsLoading ? "Loading events..." : "-- Choose Past Event --"}</option>
                                {recentEvents.map(event => (
                                    <option key={event._id} value={event._id}>
                                        {formatDate(event.eventDate)} - {event.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Hours Worked</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    value={hours}
                                    onChange={(e) => setHours(e.target.value)}
                                    placeholder="e.g. 4.0"
                                    className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                                    required
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Enter the accepted hours for this volunteer.
                            </p>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Work Description / Note (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Reason for manual entry..."
                                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background min-h-[80px]"
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={submitting || !selectedVolunteer || !selectedEventId || !hours}
                                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Mark Attendance
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

      </div>
    </ProtectedRoute>
  )
}
