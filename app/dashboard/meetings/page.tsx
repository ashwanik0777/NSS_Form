"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { format } from "date-fns"

interface Meeting {
  _id: string
  title: string
  description?: string
  meetingDate: string
  startTime?: string
  endTime?: string
  location?: string
  status: "upcoming" | "ongoing" | "completed" | "cancelled"
  isRegistered: boolean
  registrationStatus?: "registered" | "attended" | "absent"
  hoursGranted?: number
}

export default function VolunteerMeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState<string | null>(null)

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    try {
      const res = await fetch("/api/volunteer/meetings")
      const data = await res.json()
      if (data.success) {
        setMeetings(data.meetings)
      }
    } catch (error) {
      console.error("Failed to fetch meetings", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (meetingId: string) => {
    setRegistering(meetingId)
    try {
      const res = await fetch("/api/volunteer/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meetingId }),
      })
      const data = await res.json()
      if (data.success) {
        // Refresh list to show registered status
        await fetchMeetings()
      } else {
        alert(data.message || "Failed to register")
      }
    } catch (error) {
      alert("Something went wrong")
    } finally {
      setRegistering(null)
    }
  }

  const getStatusBadge = (meeting: Meeting) => {
    if (meeting.status === "cancelled") {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Cancelled</span>
    }

    if (!meeting.isRegistered) {
      return null
    }

    switch (meeting.registrationStatus) {
      case "registered":
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Registered</span>
      case "attended":
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Attended ({meeting.hoursGranted} hrs)</span>
      case "absent":
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Absent</span>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meetings</h1>
          <p className="text-muted-foreground">View and register for upcoming NSS meetings</p>
        </div>
      </div>

      {meetings.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium">No meetings found</h3>
          <p className="text-muted-foreground">There are no upcoming meetings scheduled at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((meeting) => (
            <div key={meeting._id} className="bg-card rounded-xl border border-border p-5 flex flex-col h-full shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-primary/10 text-primary px-3 py-1 rounded text-xs font-semibold">
                    {meeting.status.toUpperCase()}
                </div>
                {getStatusBadge(meeting)}
              </div>
              
              <h3 className="text-lg font-semibold mb-2">{meeting.title}</h3>
              {meeting.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">
                    {meeting.description}
                </p>
              )}

              <div className="space-y-2 text-sm text-foreground/80 mt-auto">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{format(new Date(meeting.meetingDate), "EEEE, MMMM do, yyyy")}</span>
                </div>
                {(meeting.startTime || meeting.endTime) && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>
                         {meeting.startTime ? format(new Date(meeting.startTime), "h:mm a") : "TBD"}
                         {meeting.endTime ? ` - ${format(new Date(meeting.endTime), "h:mm a")}` : ""}
                    </span>
                  </div>
                )}
                {meeting.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{meeting.location}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-border">
                {!meeting.isRegistered ? (
                    <button
                        onClick={() => handleRegister(meeting._id)}
                        disabled={registering === meeting._id || meeting.status === 'cancelled' || meeting.status === 'completed'}
                        className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                    >
                        {registering === meeting._id && <Loader2 className="w-4 h-4 animate-spin" />}
                        Register Now
                    </button>
                ) : (
                    <button disabled className="w-full py-2 bg-muted text-muted-foreground rounded-lg cursor-default border border-border font-medium">
                        Already Registered
                    </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
