"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { Megaphone, Plus, Edit, Trash2, Loader2, X, Save, Mail, Target, Eye, Users } from "lucide-react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "announcement",
    sendEmail: false,
    status: "active",
    targetType: "all",
    targetUnits: [] as string[],
  })
  const [error, setError] = useState<string | null>(null)
  const [showViewersModal, setShowViewersModal] = useState(false)
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null)
  const [viewers, setViewers] = useState<any[]>([])
  const [loadingViewers, setLoadingViewers] = useState(false)
  const { data: session } = useSession()
  const isSuperAdmin = (session?.user as any)?.role === "admin"

  const unitOptions = useMemo(() => ["1", "2", "3", "4", "5", "6"], [])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/announcements")
      const data = await res.json()
      if (data.success) {
        setAnnouncements(data.announcements || [])
      }
    } catch (error) {
      console.error("Error fetching announcements:", error)
      setError("Failed to fetch announcements")
    } finally {
      setLoading(false)
    }
  }

  const handleUnitToggle = (unit: string) => {
    setFormData((prev) => {
      const exists = prev.targetUnits.includes(unit)
      return {
        ...prev,
        targetUnits: exists ? prev.targetUnits.filter((u) => u !== unit) : [...prev.targetUnits, unit],
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (!formData.title || !formData.content) {
        setError("Title and content are required")
        setSubmitting(false)
        return
      }
      if (isSuperAdmin && formData.targetType === "units" && formData.targetUnits.length === 0) {
        setError("Please select at least one unit for targeted announcements")
        setSubmitting(false)
        return
      }

      let response
      if (editingAnnouncement) {
        response = await fetch("/api/admin/announcements", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ announcementId: editingAnnouncement._id, ...formData }),
        })
      } else {
        response = await fetch("/api/admin/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
      }

      const data = await response.json()

      if (!data.success) {
        setError(data.message || "Failed to save announcement")
        setSubmitting(false)
        return
      }

      setShowModal(false)
      setEditingAnnouncement(null)
    setFormData({
      title: "",
      content: "",
      type: "announcement",
      sendEmail: false,
      status: "active",
      targetType: "all",
      targetUnits: [],
    })
      await fetchData()
      setSubmitting(false)
    } catch (error) {
      console.error("Error saving announcement:", error)
      setError("Failed to save announcement")
      setSubmitting(false)
    }
  }

  const handleEdit = (announcement: any) => {
    setEditingAnnouncement(announcement)
    setFormData({
      title: announcement.title || "",
      content: announcement.content || "",
      type: announcement.type || "announcement",
      sendEmail: announcement.sendEmail || false,
      status: announcement.status || "active",
      targetType: announcement.targetType || "all",
      targetUnits: announcement.targetUnits || [],
    })
    setShowModal(true)
  }

  const handleDelete = async (announcementId: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/announcements?id=${announcementId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!data.success) {
        alert(data.message || "Failed to delete announcement")
        return
      }

      await fetchData()
    } catch (error) {
      console.error("Error deleting announcement:", error)
      alert("Failed to delete announcement")
    }
  }

  const handleViewViewers = async (announcementId: string) => {
    setSelectedAnnouncementId(announcementId)
    setShowViewersModal(true)
    setLoadingViewers(true)
    setViewers([])

    try {
      const response = await fetch(`/api/admin/announcements/${announcementId}/viewers`)
      const data = await response.json()

      if (data.success) {
        setViewers(data.viewers || [])
      } else {
        setError(data.message || "Failed to load viewers")
      }
    } catch (error) {
      console.error("Error fetching viewers:", error)
      setError("Failed to load viewers")
    } finally {
      setLoadingViewers(false)
    }
  }

  const getTypeBadge = (type: string) => {
    const types: Record<string, { label: string; color: string }> = {
      notification: { label: "Notification", color: "bg-blue-100 text-blue-800" },
      announcement: { label: "Announcement", color: "bg-green-100 text-green-800" },
      general: { label: "General", color: "bg-gray-100 text-gray-800" },
    }
    const config = types[type] || types.announcement
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>{config.label}</span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="sub-admin" requiredPermission="announcements.view">
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Megaphone className="w-8 h-8 mr-3 text-primary" />
            Announcement Management
          </h1>
          <p className="text-muted-foreground mt-2">Create and manage announcements for volunteers</p>
        </div>
        <button
          onClick={() => {
            setEditingAnnouncement(null)
            setFormData({
              title: "",
              content: "",
              type: "announcement",
              sendEmail: false,
              status: "active",
              targetType: "all",
              targetUnits: [],
            })
            setError(null)
            setShowModal(true)
          }}
          className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Announcement
        </button>
      </div>

      {announcements.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Megaphone className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Announcements</h3>
          <p className="text-muted-foreground">Start by creating your first announcement</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {announcements.map((announcement) => (
            <div
              key={announcement._id}
              className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-2">{announcement.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3 break-words overflow-hidden">{announcement.content}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-3">
                {getTypeBadge(announcement.type)}
                {announcement.sendEmail && (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    Emailed
                  </span>
                )}
                {announcement.targetType === "units" && Array.isArray(announcement.targetUnits) && announcement.targetUnits.length > 0 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    Units {announcement.targetUnits.join(", ")}
                  </span>
                )}
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    announcement.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {announcement.status}
                </span>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div className="flex items-center gap-4">
                  <p className="text-xs text-muted-foreground">
                    {new Date(announcement.createdAt).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => handleViewViewers(announcement._id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="View who read this announcement"
                  >
                    <Eye className="w-3 h-3" />
                    <span className="font-medium">
                      {announcement.viewCount || 0}/{announcement.totalEligible || 0}
                    </span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(announcement._id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-xl border border-border p-6 max-w-2xl w-full my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {editingAnnouncement ? "Edit Announcement" : "Add New Announcement"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingAnnouncement(null)
                  setError(null)
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter announcement title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Content <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-y break-words"
                  placeholder="Enter announcement content"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="announcement">Announcement</option>
                    <option value="notification">Notification</option>
                    <option value="general">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {isSuperAdmin && (
                <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
                  <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Audience Targeting
                  </p>
                  <div className="flex flex-col md:flex-row gap-3">
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="radio"
                        name="targetType"
                        value="all"
                        checked={formData.targetType === "all"}
                        onChange={() => setFormData({ ...formData, targetType: "all", targetUnits: [] })}
                        className="w-4 h-4 text-primary"
                      />
                      All approved volunteers
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="radio"
                        name="targetType"
                        value="units"
                        checked={formData.targetType === "units"}
                        onChange={() =>
                          setFormData((prev) => ({
                            ...prev,
                            targetType: "units",
                            targetUnits: prev.targetUnits.length ? prev.targetUnits : [unitOptions[0]],
                          }))
                        }
                        className="w-4 h-4 text-primary"
                      />
                      Specific units
                    </label>
                  </div>
                  {formData.targetType === "units" && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {unitOptions.map((unit) => (
                        <label key={unit} className="flex items-center gap-2 text-sm border border-border rounded-md px-3 py-2 bg-background">
                          <input
                            type="checkbox"
                            checked={formData.targetUnits.includes(unit)}
                            onChange={() => handleUnitToggle(unit)}
                            className="w-4 h-4 text-primary"
                          />
                          Unit {unit}
                        </label>
                      ))}
                    </div>
                  )}
                  {formData.targetType === "units" && formData.targetUnits.length === 0 && (
                    <p className="text-xs text-red-500">Select at least one unit.</p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg border border-border">
                <input
                  type="checkbox"
                  id="sendEmail"
                  checked={formData.sendEmail}
                  onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                  className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                />
                <label htmlFor="sendEmail" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    <div>
                      <p className="font-medium text-foreground">Send Email to All Approved Volunteers</p>
                      <p className="text-xs text-muted-foreground">
                        Announcement will be emailed to all volunteers with approved applications
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingAnnouncement(null)
                    setError(null)
                  }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingAnnouncement ? "Update" : "Create"} Announcement
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Viewers Modal */}
      {showViewersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-xl border border-border p-6 max-w-2xl w-full my-8 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                Announcement Viewers
              </h2>
              <button
                onClick={() => {
                  setShowViewersModal(false)
                  setSelectedAnnouncementId(null)
                  setViewers([])
                  setError(null)
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingViewers ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
              </div>
            ) : viewers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No one has viewed this announcement yet.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium text-foreground">
                    Total Views: <span className="text-primary">{viewers.length}</span>
                  </p>
                </div>
                <div className="space-y-2">
                  {viewers.map((viewer, index) => (
                    <div
                      key={viewer._id || index}
                      className="p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">{viewer.name}</p>
                          <p className="text-sm text-muted-foreground mt-1">{viewer.email}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-muted-foreground">Unit: {viewer.unitNo}</span>
                            <span className="text-xs text-muted-foreground">
                              Viewed: {new Date(viewer.viewedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  )
}

