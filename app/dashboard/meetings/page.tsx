"use client"

import { useEffect, useState } from "react"
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle, Loader2, ArrowLeft, Users } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"

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
      return (
        <span className="px-2.5 py-1 bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 rounded-full text-xs font-semibold">
          Cancelled
        </span>
      )
    }

    if (!meeting.isRegistered) {
      return null
    }

    switch (meeting.registrationStatus) {
      case "registered":
        return (
          <span className="px-2.5 py-1 bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 rounded-full text-xs font-semibold flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Registered
          </span>
        )
      case "attended":
        return (
          <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-semibold flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Attended ({meeting.hoursGranted} hrs)
          </span>
        )
      case "absent":
        return (
          <span className="px-2.5 py-1 bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 rounded-full text-xs font-semibold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Absent
          </span>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground animate-pulse">Loading Meetings...</p>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-5 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all w-fit shadow-xs"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Dashboard</span>
      </Link>

      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Official NSS Meetings & Briefings
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Register for upcoming unit assemblies and review your attendance status
            </p>
          </div>
        </div>
      </div>

      {meetings.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-2xl border border-border p-6 shadow-xs">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-40" />
          <h3 className="text-base font-bold text-foreground">No Meetings Scheduled</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
            There are currently no meetings scheduled by your Program Officer. Please check back later.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {meetings.map((meeting) => (
            <div
              key={meeting._id}
              className="bg-card rounded-2xl border border-border p-4 sm:p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all gap-4"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="bg-primary/10 text-primary px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
                    {meeting.status}
                  </span>
                  {getStatusBadge(meeting)}
                </div>

                <h3 className="text-base font-bold text-foreground mb-1.5 leading-snug">
                  {meeting.title}
                </h3>
                {meeting.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {meeting.description}
                  </p>
                )}

                <div className="space-y-1.5 text-xs text-muted-foreground pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{format(new Date(meeting.meetingDate), "EEEE, MMMM d, yyyy")}</span>
                  </div>
                  {(meeting.startTime || meeting.endTime) && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>
                        {meeting.startTime ? format(new Date(meeting.startTime), "h:mm a") : "TBD"}
                        {meeting.endTime ? ` - ${format(new Date(meeting.endTime), "h:mm a")}` : ""}
                      </span>
                    </div>
                  )}
                  {meeting.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{meeting.location}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-border">
                {!meeting.isRegistered ? (
                  <button
                    onClick={() => handleRegister(meeting._id)}
                    disabled={
                      registering === meeting._id ||
                      meeting.status === "cancelled" ||
                      meeting.status === "completed"
                    }
                    className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
                  >
                    {registering === meeting._id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Register for Meeting</span>
                  </button>
                ) : (
                  <div className="w-full py-2 bg-muted text-muted-foreground rounded-xl text-center text-xs font-medium border border-border">
                    Already Registered
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
