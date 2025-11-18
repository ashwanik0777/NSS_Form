"use client"

import { useEffect, useState } from "react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { Loader2, Send, PlusCircle, FileText, AlertCircle, CheckCircle2, Clock, X, Paperclip, MessageSquare } from "lucide-react"

export default function VolunteerReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedReport, setSelectedReport] = useState<any | null>(null)
  const [replying, setReplying] = useState(false)
  const [replyMessage, setReplyMessage] = useState("")
  const [uploading, setUploading] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    category: "",
    subject: "",
    description: "",
    priority: "medium",
    attachments: [] as string[],
  })

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/reports")
      const data = await res.json()
      if (data.success) setReports(data.reports || [])
    } catch (e) {
      console.error("Error loading reports:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleFileUpload = async (file: File) => {
    setUploading("uploading")
    try {
      const formData = new FormData()
      formData.append("file", file)
      
      const res = await fetch("/api/upload/cloudinary", {
        method: "POST",
        body: formData,
      })
      
      const data = await res.json()
      if (data.success && data.url) {
        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, data.url]
        }))
        setUploading(null)
        return data.url
      } else {
        setError(data.message || "Upload failed")
        setUploading(null)
        return null
      }
    } catch (e) {
      setError("File upload failed")
      setUploading(null)
      return null
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    
    try {
      if (!formData.category || !formData.subject || !formData.description) {
        setError("Please fill all required fields")
        setSubmitting(false)
        return
      }
      
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      
      const data = await res.json()
      if (data.success) {
        setSuccess(`Report submitted successfully! Your Report ID is: ${data.report.reportId}`)
        setShowForm(false)
        setFormData({
          category: "",
          subject: "",
          description: "",
          priority: "medium",
          attachments: [],
        })
        load()
        setTimeout(() => setSuccess(null), 5000)
      } else {
        setError(data.message || "Failed to submit report")
      }
    } catch (e) {
      setError("Failed to submit report")
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="volunteer">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
              <FileText className="w-8 h-8 text-primary" />
              Report & Issue Management
            </h1>
            <p className="text-muted-foreground mt-1">Submit and track your reports, complaints, and suggestions</p>
          </div>
          <button
            onClick={() => {
              setShowForm(true)
              setError(null)
              setSuccess(null)
            }}
            className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            New Report
          </button>
        </div>

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {showForm && (
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Submit New Report</h3>
              <button
                onClick={() => {
                  setShowForm(false)
                  setError(null)
                  setFormData({
                    category: "",
                    subject: "",
                    description: "",
                    priority: "medium",
                    attachments: [],
                  })
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
            
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    <option value="problem">Problem</option>
                    <option value="complaint">Complaint</option>
                    <option value="suggestion">Suggestion</option>
                    <option value="bug">Bug Report</option>
                    <option value="event-issue">Event Issue</option>
                    <option value="volunteer-issue">Volunteer Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Brief title of your report"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Provide detailed information about your report..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Attachments (Optional)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || [])
                    for (const file of files) {
                      await handleFileUpload(file)
                    }
                  }}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  accept="image/*,.pdf,.doc,.docx"
                />
                {uploading && (
                  <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
                )}
                {formData.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {formData.attachments.map((url, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Paperclip className="w-4 h-4" />
                        <span className="truncate">{url.split("/").pop()}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              attachments: prev.attachments.filter((_, i) => i !== idx)
                            }))
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setError(null)
                    setFormData({
                      category: "",
                      subject: "",
                      description: "",
                      priority: "medium",
                      attachments: [],
                    })
                  }}
                  className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {reports.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Reports</h3>
            <p className="text-muted-foreground">You haven't submitted any reports yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report._id}
                className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedReport(selectedReport?._id === report._id ? null : report)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-foreground">{report.subject}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status.replace("-", " ").toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(report.priority)}`}>
                        {report.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                      <span>ID: <strong className="text-foreground">{report.reportId}</strong></span>
                      <span>Category: <strong className="text-foreground">{getCategoryLabel(report.category)}</strong></span>
                      <span>Created: {new Date(report.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-foreground line-clamp-2">{report.description}</p>
                    {report.attachments && report.attachments.length > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Paperclip className="w-4 h-4" />
                        <span>{report.attachments.length} attachment(s)</span>
                      </div>
                    )}
                    {report.replies && report.replies.length > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="w-4 h-4" />
                        <span>{report.replies.length} reply/replies</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedReport?._id === report._id && (
                  <div className="mt-4 pt-4 border-t border-border space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Full Description</h4>
                      <p className="text-foreground whitespace-pre-wrap">{report.description}</p>
                    </div>

                    {report.attachments && report.attachments.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Attachments</h4>
                        <div className="space-y-2">
                          {report.attachments.map((url: string, idx: number) => (
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

                    {report.adminNotes && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <h4 className="font-semibold text-blue-900 mb-1">Admin Notes</h4>
                        <p className="text-blue-800 text-sm whitespace-pre-wrap">{report.adminNotes}</p>
                      </div>
                    )}

                    {report.resolutionNotes && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <h4 className="font-semibold text-green-900 mb-1">Resolution Notes</h4>
                        <p className="text-green-800 text-sm whitespace-pre-wrap">{report.resolutionNotes}</p>
                      </div>
                    )}

                    {report.replies && report.replies.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">Replies</h4>
                        <div className="space-y-3">
                          {report.replies.map((reply: any, idx: number) => (
                            <div key={idx} className={`p-3 rounded-lg ${reply.isAdmin ? "bg-blue-50 border border-blue-200" : "bg-gray-50 border border-gray-200"}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-foreground">
                                  {reply.userId?.name || "User"}
                                  {reply.isAdmin && <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Admin</span>}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(reply.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-foreground text-sm whitespace-pre-wrap">{reply.message}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Add Reply</h4>
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent mb-2"
                        placeholder="Type your reply here..."
                      />
                      <button
                        onClick={() => handleReply(report.reportId)}
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
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}



