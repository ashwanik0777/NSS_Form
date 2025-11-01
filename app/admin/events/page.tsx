"use client"

import { useEffect, useState } from "react"
import { Calendar, Plus, Edit, Trash2, Users, Loader2, X, Save, Clock } from "lucide-react"

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<any>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: "",
    eventDate: "",
    location: "",
    startTime: "",
    endTime: "",
    coordinator: "",
    maxParticipants: "",
    status: "upcoming",
  })
  const [projects, setProjects] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Fetch projects for dropdown
      const projectsRes = await fetch("/api/admin/projects")
      const projectsData = await projectsRes.json()
      if (projectsData.success) {
        setProjects(projectsData.projects || [])
      }

      // TODO: Fetch events when API is ready
      // For now, set empty array
      setEvents([])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
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
            <Calendar className="w-8 h-8 mr-3 text-primary" />
            Event Management
          </h1>
          <p className="text-muted-foreground mt-2">Create and manage NSS events</p>
        </div>
        <button
          onClick={() => {
            setEditingEvent(null)
            setFormData({
              title: "",
              description: "",
              projectId: "",
              eventDate: "",
              location: "",
              startTime: "",
              endTime: "",
              coordinator: "",
              maxParticipants: "",
              status: "upcoming",
            })
            setShowModal(true)
          }}
          className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Events</h3>
          <p className="text-muted-foreground">Start by creating your first event</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Project</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Participants</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map((event) => (
                  <tr key={event._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground">{event.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{event.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{event.projectId?.title || "N/A"}</td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {new Date(event.eventDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {event.currentParticipants} / {event.maxParticipants || "∞"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          event.status === "upcoming"
                            ? "bg-blue-100 text-blue-800"
                            : event.status === "ongoing"
                              ? "bg-yellow-100 text-yellow-800"
                              : event.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Modal - Placeholder */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 max-w-2xl w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Add Event</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-muted-foreground">Event management form will be implemented here</p>
          </div>
        </div>
      )}
    </div>
  )
}
