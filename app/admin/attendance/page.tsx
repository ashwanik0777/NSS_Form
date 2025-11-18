"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import AdminHeader from "@/components/admin/AdminHeader"
import {
  Loader2,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Image,
  Eye,
} from "lucide-react"

interface AttendanceRecord {
  _id: string
  volunteerId: { _id: string; name: string; email: string }
  projectId?: { _id: string; title: string }
  eventId?: {
    _id: string
    title: string
    eventDate?: string
    startTime?: string
    endTime?: string
    nssHours?: number
  }
  startTime?: string
  endTime?: string
  startPhoto?: string
  endPhoto?: string
  startLocation?: { latitude?: number; longitude?: number; address?: string }
  endLocation?: { latitude?: number; longitude?: number; address?: string }
  hoursWorked?: number
  pendingHours?: number
  reviewStatus: "pending" | "approved" | "rejected"
  reviewNotes?: string
  reviewedAt?: string
  status: string
  workDescription?: string
  createdAt?: string
}

export default function AttendanceReviewPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({ reviewStatus: "pending", search: "" })
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null)
  const [notes, setNotes] = useState("")
  const [hoursInput, setHoursInput] = useState("")

  const loadAttendances = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (filters.reviewStatus && filters.reviewStatus !== "all") {
        params.set("reviewStatus", filters.reviewStatus)
      }
      if (filters.search) {
        params.set("search", filters.search)
      }
      const res = await fetch(`/api/admin/attendance?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setRecords(data.attendances || [])
      } else {
        setError(data.message || "Failed to load attendance records")
      }
    } catch (err) {
      console.error("Attendance fetch error:", err)
      setError("Failed to load attendance records")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAttendances()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.reviewStatus])

  const handleSearch = () => {
    loadAttendances()
  }

  const handleAction = async (action: "approve" | "reject") => {
    if (!selectedRecord) return
    if (action === "reject" && !notes.trim()) {
      setError("Please provide a reason for rejection")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const payload: any = {
        attendanceId: selectedRecord._id,
        action,
        notes: notes.trim() || undefined,
      }
      if (action === "approve") {
        payload.hours = hoursInput ? Number(hoursInput) : undefined
      }
      const res = await fetch("/api/admin/attendance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        setSelectedRecord(null)
        setNotes("")
        setHoursInput("")
        await loadAttendances()
      } else {
        setError(data.message || "Failed to update attendance")
      }
    } catch (err) {
      console.error("Attendance update error:", err)
      setError("Failed to update attendance")
    } finally {
      setSubmitting(false)
    }
  }

  const getReviewBadge = (status: AttendanceRecord["reviewStatus"]) => {
    const config = {
      pending: { label: "Pending", classes: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      approved: { label: "Approved", classes: "bg-green-100 text-green-800 border-green-200" },
      rejected: { label: "Rejected", classes: "bg-red-100 text-red-800 border-red-200" },
    } as const
    const state = config[status]
    return <span className={`px-3 py-1 rounded-full text-xs font-medium border ${state.classes}`}>{state.label}</span>
  }

  const selectedHours = useMemo(() => {
    if (!selectedRecord) return 0
    if (selectedRecord.pendingHours && selectedRecord.pendingHours > 0) return selectedRecord.pendingHours
    return selectedRecord.hoursWorked || 0
  }, [selectedRecord])

  return (
    <ProtectedRoute requiredRole="sub-admin" requiredPermission="events.manage">
      <AdminHeader title="Attendance Review" subtitle="Approve volunteer attendance submissions" />

      <div className="p-6 space-y-6">
        <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-3">
            <div className="flex items-center px-3 py-2 border border-border rounded-lg bg-input">
              <Filter className="w-4 h-4 text-muted-foreground mr-2" />
              <select
                value={filters.reviewStatus}
                onChange={(e) => setFilters((prev) => ({ ...prev, reviewStatus: e.target.value }))}
                className="bg-transparent outline-none text-sm"
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center px-3 py-2 border border-border rounded-lg bg-input">
              <Search className="w-4 h-4 text-muted-foreground mr-2" />
              <input
                type="text"
                placeholder="Search volunteer or event"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="bg-transparent outline-none text-sm w-48"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Apply
            </button>
          </div>
        </div>

        {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : records.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-semibold text-foreground mb-1">No attendance submissions</p>
            <p className="text-muted-foreground text-sm">
              {filters.reviewStatus === "pending"
                ? "All caught up! No pending reviews right now."
                : "No records found for the selected filter."}
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/40 text-left">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground">Volunteer</th>
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground">Event</th>
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground">Pending Hours</th>
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {records.map((record) => (
                    <tr key={record._id} className="hover:bg-muted/20">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{record.volunteerId?.name || "Volunteer"}</div>
                        <div className="text-xs text-muted-foreground">{record.volunteerId?.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-foreground">{record.eventId?.title || "Event"}</div>
                        <div className="text-xs text-muted-foreground">
                          {record.eventId?.eventDate ? new Date(record.eventId.eventDate).toLocaleString() : "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {record.pendingHours && record.pendingHours > 0 ? (
                          <span className="font-semibold text-foreground">{record.pendingHours}h</span>
                        ) : (
                          <span className="text-muted-foreground">{record.hoursWorked || 0}h</span>
                        )}
                      </td>
                      <td className="px-6 py-4">{getReviewBadge(record.reviewStatus)}</td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedRecord(record)
                            setNotes(record.reviewNotes || "")
                            setHoursInput(
                              record.pendingHours && record.pendingHours > 0
                                ? record.pendingHours.toString()
                                : record.hoursWorked?.toString() || "",
                            )
                          }}
                          className="inline-flex items-center px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between p-6 border-b border-border">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Event</p>
                <h2 className="text-2xl font-bold text-foreground">{selectedRecord.eventId?.title || "Event"}</h2>
                <p className="text-sm text-muted-foreground">
                  {selectedRecord.eventId?.eventDate ? new Date(selectedRecord.eventId.eventDate).toLocaleString() : "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">{getReviewBadge(selectedRecord.reviewStatus)}</div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-muted/40 p-4 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Volunteer</p>
                  <p className="font-semibold text-foreground">{selectedRecord.volunteerId?.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedRecord.volunteerId?.email}</p>
                </div>
                <div className="bg-muted/40 p-4 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Project</p>
                  <p className="font-semibold text-foreground">{selectedRecord.projectId?.title || "—"}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">Start Attendance</span>
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {selectedRecord.startTime ? new Date(selectedRecord.startTime).toLocaleString() : "Not recorded"}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    {selectedRecord.startLocation?.address || "No address"}
                  </p>
                  {selectedRecord.startPhoto ? (
                    <img
                      src={selectedRecord.startPhoto}
                      alt="Start"
                      className="mt-3 rounded-lg border border-border object-cover w-full h-40"
                    />
                  ) : (
                    <div className="mt-3 h-40 border border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground text-sm">
                      <Image className="w-6 h-6 mb-2" />
                      No photo
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">End Attendance</span>
                    <CheckCircle className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {selectedRecord.endTime ? new Date(selectedRecord.endTime).toLocaleString() : "Not recorded"}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    {selectedRecord.endLocation?.address || "No address"}
                  </p>
                  {selectedRecord.endPhoto ? (
                    <img
                      src={selectedRecord.endPhoto}
                      alt="End"
                      className="mt-3 rounded-lg border border-border object-cover w-full h-40"
                    />
                  ) : (
                    <div className="mt-3 h-40 border border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground text-sm">
                      <Image className="w-6 h-6 mb-2" />
                      No photo
                    </div>
                  )}
                </div>
              </div>

              {selectedRecord.workDescription && (
                <div className="border border-border rounded-lg p-4">
                  <p className="text-sm font-semibold text-foreground mb-2">Work Description</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedRecord.workDescription}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Eligible Hours</p>
                  <p className="text-2xl font-bold text-foreground">{selectedHours}h</p>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Event Hours</p>
                  <p className="text-2xl font-bold text-foreground">{selectedRecord.eventId?.nssHours || "—"}</p>
                </div>
                <div className="border border-border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">Current Status</p>
                  <p className="text-lg font-semibold capitalize">{selectedRecord.reviewStatus}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-border rounded-lg p-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Approved Hours</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={hoursInput}
                    onChange={(e) => setHoursInput(e.target.value)}
                    placeholder={selectedHours.toString()}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Leave blank to use eligible hours.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Review Notes</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add an internal note or rejection reason"
                    className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 justify-end">
                <button
                  onClick={() => {
                    setSelectedRecord(null)
                    setNotes("")
                    setHoursInput("")
                    setError(null)
                  }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleAction("reject")}
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </button>
                <button
                  onClick={() => handleAction("approve")}
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}



