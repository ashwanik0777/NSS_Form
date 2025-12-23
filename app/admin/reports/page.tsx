"use client"

import { useEffect, useState } from "react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { Loader2, Filter, Search, FileText, User, Calendar, MessageSquare, Paperclip, Send, X, CheckCircle2, Clock, AlertCircle } from "lucide-react"

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<any | null>(null)
  const [replying, setReplying] = useState(false)
  const [replyMessage, setReplyMessage] = useState("")
  const [admins, setAdmins] = useState<any[]>([])
  const [filters, setFilters] = useState({
    status: "all",
    category: "all",
    priority: "all",
    assignedTo: "all",
    search: "",
  })
  const [formData, setFormData] = useState({
    status: "",
    adminNotes: "",
    resolutionNotes: "",
    assignedTo: "",
  })

  const loadAdmins = async () => {
    try {
      const res = await fetch("/api/admin/users")
      const data = await res.json()
      if (data.success) {
        const adminUsers = (data.users || []).filter(
          (u: any) => u.role === "admin" || u.role === "sub-admin"
        )
        setAdmins(adminUsers)
      }
    } catch (e) {
      console.error("Error loading admins:", e)
    }
  }

  const load = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status !== "all") params.set("status", filters.status)
      if (filters.category !== "all") params.set("category", filters.category)
      if (filters.priority !== "all") params.set("priority", filters.priority)
      if (filters.assignedTo !== "all") params.set("assignedTo", filters.assignedTo)
      if (filters.search) params.set("search", filters.search)

      const res = await fetch(`/api/reports?${params.toString()}`)
      const data = await res.json()
      if (data.success) setReports(data.reports || [])
    } catch (e) {
      console.error("Error loading reports:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdmins()
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const handleUpdate = async (reportId: string) => {
    if (!formData.status && !formData.adminNotes && !formData.resolutionNotes && !formData.assignedTo) {
      setError("Please make at least one change")
      return
    }

    setSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          ...formData,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setSuccess("Report updated successfully")
        setSelectedReport(null)
        setFormData({
          status: "",
          adminNotes: "",
          resolutionNotes: "",
          assignedTo: "",
        })
        load()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.message || "Failed to update report")
      }
    } catch (e) {
      setError("Failed to update report")
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (reportId: string) => {
    if (!replyMessage.trim()) {
      setError("Please enter a reply message")
      return
    }

    setReplying(true)
    setError(null)

    try {
      const res = await fetch("/api/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          replyMessage: replyMessage.trim(),
        }),
      })

      const data = await res.json()
      if (data.success) {
        setReplyMessage("")
        setSelectedReport(null)
        load()
        setSuccess("Reply sent successfully")
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.message || "Failed to send reply")
      }
    } catch (e) {
      setError("Failed to send reply")
    } finally {
      setReplying(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800"
      case "in-progress":
        return "bg-yellow-100 text-yellow-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "urgent":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      problem: "Problem",
      complaint: "Complaint",
      suggestion: "Suggestion",
      bug: "Bug Report",
      "event-issue": "Event Issue",
      "volunteer-issue": "Volunteer Issue",
      other: "Other",
    }
    return labels[category] || category
  }

  // Calculate stats
  const stats = {
    total: reports.length,
    open: reports.filter((r) => r.status === "open").length,
    inProgress: reports.filter((r) => r.status === "in-progress").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
    urgent: reports.filter((r) => r.priority === "urgent").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="sub-admin" requiredPermission="volunteers.view">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-8 h-8 text-primary" />
              Report & Issue Management
            </h1>
            <p className="text-muted-foreground mt-1">Manage and resolve all reports, complaints, and suggestions</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="text-sm text-muted-foreground">Total Reports</div>
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <div className="text-sm text-blue-700">Open</div>
            <div className="text-2xl font-bold text-blue-900">{stats.open}</div>
          </div>
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
            <div className="text-sm text-yellow-700">In Progress</div>
            <div className="text-2xl font-bold text-yellow-900">{stats.inProgress}</div>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
            <div className="text-sm text-green-700">Resolved</div>
            <div className="text-2xl font-bold text-green-900">{stats.resolved}</div>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 p-4">
            <div className="text-sm text-red-700">Urgent</div>
            <div className="text-2xl font-bold text-red-900">{stats.urgent}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search reports..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="problem">Problem</option>
              <option value="complaint">Complaint</option>
              <option value="suggestion">Suggestion</option>
              <option value="bug">Bug Report</option>
              <option value="event-issue">Event Issue</option>
              <option value="volunteer-issue">Volunteer Issue</option>
              <option value="other">Other</option>
            </select>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <select
              value={filters.assignedTo}
              onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
              className="px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {admins.map((admin) => (
                <option key={admin._id} value={admin._id}>
                  {admin.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Reports Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  {/* <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Report ID</th> */}
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">User</th>
                  {/* <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Subject</th> */}
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Priority</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Assigned To</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-muted-foreground">
                      No reports found for selected filters.
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => (
                    <tr key={report._id} className="hover:bg-muted/30 transition-colors">
                      {/* <td className="px-6 py-4 text-sm font-mono text-foreground">{report.reportId}</td> */}
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-foreground">{report.userId?.name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{report.userId?.email}</div>
                      </td>
                      {/* <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{report.subject}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1">{report.description}</div>
                      </td> */}
                      <td className="px-6 py-4 text-sm text-foreground">{getCategoryLabel(report.category)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                          {report.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                          {report.status.replace("-", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {report.assignedTo?.name || <span className="text-muted-foreground">Unassigned</span>}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedReport(selectedReport?._id === report._id ? null : report)
                            setFormData({
                              status: report.status,
                              adminNotes: report.adminNotes || "",
                              resolutionNotes: report.resolutionNotes || "",
                              assignedTo: report.assignedTo?._id || "",
                            })
                            setError(null)
                          }}
                          className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          {selectedReport?._id === report._id ? "Hide" : "View/Edit"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report Detail Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl border border-border max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Report Details</h2>
                  <p className="text-sm text-muted-foreground">ID: {selectedReport.reportId}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedReport(null)
                    setFormData({
                      status: "",
                      adminNotes: "",
                      resolutionNotes: "",
                      assignedTo: "",
                    })
                    setReplyMessage("")
                    setError(null)
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Report Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">User</label>
                    <p className="text-foreground font-medium">{selectedReport.userId?.name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{selectedReport.userId?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <p className="text-foreground">{getCategoryLabel(selectedReport.category)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Priority</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedReport.priority)}`}>
                      {selectedReport.priority.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created</label>
                    <p className="text-foreground">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subject</label>
                  <p className="text-foreground font-medium">{selectedReport.subject}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="text-foreground whitespace-pre-wrap">{selectedReport.description}</p>
                </div>

                {selectedReport.attachments && selectedReport.attachments.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Attachments</label>
                    <div className="space-y-2">
                      {selectedReport.attachments.map((url: string, idx: number) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <Paperclip className="w-4 h-4" />
                          <span>{url.split("/").pop()}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Actions */}
                <div className="border-t border-border pt-6 space-y-4">
                  <h3 className="font-semibold text-foreground">Admin Actions</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="open">Open</option>
                        <option value="in-progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Assign To</label>
                      <select
                        value={formData.assignedTo}
                        onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Unassigned</option>
                        {admins.map((admin) => (
                          <option key={admin._id} value={admin._id}>
                            {admin.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Admin Notes (Internal)</label>
                    <textarea
                      value={formData.adminNotes}
                      onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Internal notes (not visible to user)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Resolution Notes</label>
                    <textarea
                      value={formData.resolutionNotes}
                      onChange={(e) => setFormData({ ...formData, resolutionNotes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Resolution details (visible to user)"
                    />
                  </div>

                  <button
                    onClick={() => handleUpdate(selectedReport.reportId)}
                    disabled={submitting}
                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Update Report
                      </>
                    )}
                  </button>
                </div>

                {/* Replies Section */}
                <div className="border-t border-border pt-6 space-y-4">
                  <h3 className="font-semibold text-foreground">Replies</h3>

                  {selectedReport.replies && selectedReport.replies.length > 0 && (
                    <div className="space-y-3">
                      {selectedReport.replies.map((reply: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg ${
                            reply.isAdmin ? "bg-blue-50 border border-blue-200" : "bg-gray-50 border border-gray-200"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-foreground">
                              {reply.userId?.name || "User"}
                              {reply.isAdmin && (
                                <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Admin</span>
                              )}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(reply.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-foreground text-sm whitespace-pre-wrap">{reply.message}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Add Reply</label>
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent mb-2"
                      placeholder="Type your reply here..."
                    />
                    <button
                      onClick={() => handleReply(selectedReport.reportId)}
                      disabled={replying || !replyMessage.trim()}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      {replying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Reply
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}



