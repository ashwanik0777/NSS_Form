"use client"

import { useEffect, useState } from "react"
import {
  FolderKanban,
  Plus,
  Edit,
  Trash2,
  Users,
  TrendingUp,
  Calendar,
  MapPin,
  Loader2,
  X,
  Save,
  BarChart3,
} from "lucide-react"

interface Project {
  _id: string
  title: string
  description: string
  location?: string
  startDate?: string
  endDate?: string
  coordinator?: string
  maxVolunteers?: number
  currentVolunteers: number
  actualVolunteerCount?: number
  status: string
  category?: string
}

interface Volunteer {
  _id: string
  name: string
  email: string
  selectedAt: string
}

interface Analytics {
  totalProjects: number
  totalVolunteers: number
  mostPopularProject: Project | null
}

export default function ProjectManagementPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projectVolunteers, setProjectVolunteers] = useState<Volunteer[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    startDate: "",
    endDate: "",
    coordinator: "",
    maxVolunteers: "",
    status: "active",
    category: "",
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/admin/projects")
      const data = await res.json()
      if (data.success) {
        setProjects(data.projects || [])
        setAnalytics(data.analytics || null)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectVolunteers = async (projectId: string) => {
    try {
      const res = await fetch(`/api/admin/projects?id=${projectId}`)
      const data = await res.json()
      if (data.success && data.project) {
        setProjectVolunteers(data.project.volunteers || [])
        setSelectedProject(data.project)
      }
    } catch (error) {
      console.error("Error fetching volunteers:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editingProject ? "/api/admin/projects" : "/api/admin/projects"
      const method = editingProject ? "PATCH" : "POST"
      const body = editingProject
        ? { id: editingProject._id, ...formData }
        : formData

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        setEditingProject(null)
        setFormData({
          title: "",
          description: "",
          location: "",
          startDate: "",
          endDate: "",
          coordinator: "",
          maxVolunteers: "",
          status: "active",
          category: "",
        })
        fetchProjects()
      }
    } catch (error) {
      console.error("Error saving project:", error)
    }
  }

  const handleEdit = (project: Project) => {
    setEditingProject(project)
    setFormData({
      title: project.title,
      description: project.description,
      location: project.location || "",
      startDate: project.startDate ? project.startDate.split("T")[0] : "",
      endDate: project.endDate ? project.endDate.split("T")[0] : "",
      coordinator: project.coordinator || "",
      maxVolunteers: project.maxVolunteers?.toString() || "",
      status: project.status,
      category: project.category || "",
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return

    try {
      const res = await fetch(`/api/admin/projects?id=${id}`, {
        method: "DELETE",
      })

      const data = await res.json()
      if (data.success) {
        fetchProjects()
      }
    } catch (error) {
      console.error("Error deleting project:", error)
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <FolderKanban className="w-8 h-8 mr-3 text-primary" />
            Project Management
          </h1>
          <p className="text-muted-foreground mt-2">Manage NSS projects and track volunteer participation</p>
        </div>
        <button
          onClick={() => {
            setEditingProject(null)
            setFormData({
              title: "",
              description: "",
              location: "",
              startDate: "",
              endDate: "",
              coordinator: "",
              maxVolunteers: "",
              status: "active",
              category: "",
            })
            setShowModal(true)
          }}
          className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Project
        </button>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Projects</p>
                <p className="text-3xl font-bold text-foreground mt-2">{analytics.totalProjects}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FolderKanban className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Volunteers</p>
                <p className="text-3xl font-bold text-foreground mt-2">{analytics.totalVolunteers}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {analytics.mostPopularProject && (
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Most Popular Project</p>
                  <p className="text-lg font-bold text-foreground mt-2 truncate">
                    {analytics.mostPopularProject.title}
                  </p>
                  <p className="text-sm text-primary mt-1">
                    {analytics.mostPopularProject.volunteerCount} volunteers
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Projects Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Title</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Volunteers</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Location</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.map((project) => (
                <tr key={project._id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-foreground">{project.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => fetchProjectVolunteers(project._id)}
                      className="flex items-center text-primary hover:text-primary/80"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {project.actualVolunteerCount || project.currentVolunteers} /{" "}
                      {project.maxVolunteers || "∞"}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        project.status === "active"
                          ? "bg-green-100 text-green-800"
                          : project.status === "completed"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{project.location || "N/A"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(project)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(project._id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {editingProject ? "Edit Project" : "Add New Project"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingProject(null)
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description *</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Coordinator</label>
                  <input
                    type="text"
                    value={formData.coordinator}
                    onChange={(e) => setFormData({ ...formData, coordinator: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Max Volunteers</label>
                  <input
                    type="number"
                    value={formData.maxVolunteers}
                    onChange={(e) => setFormData({ ...formData, maxVolunteers: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground"
                >
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="upcoming">Upcoming</option>
                </select>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingProject(null)
                  }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Volunteers Modal */}
      {selectedProject && projectVolunteers.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedProject.title}</h2>
                <p className="text-muted-foreground">Volunteers ({projectVolunteers.length})</p>
              </div>
              <button
                onClick={() => {
                  setSelectedProject(null)
                  setProjectVolunteers([])
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {projectVolunteers.map((volunteer) => (
                <div
                  key={volunteer._id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-foreground">{volunteer.name}</p>
                    <p className="text-sm text-muted-foreground">{volunteer.email}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Joined: {new Date(volunteer.selectedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

