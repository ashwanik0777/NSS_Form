"use client"

import { useEffect, useState } from "react"
import { Megaphone, Plus, Edit, Trash2, Loader2, X, Save, Bell, Mail } from "lucide-react"

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
  })
  const [error, setError] = useState<string | null>(null)

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
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">{announcement.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{announcement.content}</p>
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
                <p className="text-xs text-muted-foreground">
                  {new Date(announcement.createdAt).toLocaleDateString()}
                </p>
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
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
    </div>
  )
}

