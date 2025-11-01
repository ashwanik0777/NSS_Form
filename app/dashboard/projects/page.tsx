"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, FolderKanban, CheckCircle, AlertCircle, ArrowRight } from "lucide-react"

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
  status: string
  category?: string
}

export default function ProjectsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    const user = session?.user as any
    if (!user) {
      router.replace("/login")
      return
    }
    fetchProjects()
  }, [session, status, router])

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/volunteer/projects")
      const data = await res.json()
      if (data.success) {
        setProjects(data.projects || [])
        setSelectedProject(data.selectedProject)
        if (data.hasSelected && !data.selectedProject) {
          // Already selected but redirect to dashboard
          router.push("/dashboard")
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectProject = async (projectId: string) => {
    if (selecting) return
    setSelecting(true)
    try {
      const res = await fetch("/api/volunteer/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      })

      const data = await res.json()
      if (data.success) {
        // Redirect to dashboard after selection
        router.push("/dashboard")
      } else {
        alert(data.message || "Failed to select project")
      }
    } catch (error) {
      alert("Error selecting project")
    } finally {
      setSelecting(false)
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    )
  }

  if (selectedProject) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-800 mb-2">Project Already Selected</h2>
          <p className="text-green-700 mb-4">You have already selected a project</p>
          <div className="bg-white rounded-lg p-6 mt-4">
            <h3 className="text-xl font-semibold text-foreground mb-2">{selectedProject.title}</h3>
            <p className="text-muted-foreground">{selectedProject.description}</p>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <FolderKanban className="w-8 h-8 mr-3 text-primary" />
          Select NSS Project
        </h1>
        <p className="text-muted-foreground mt-2">
          Choose a project to participate in. You can only select one project.
        </p>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-12 text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Projects Available</h3>
          <p className="text-muted-foreground">There are no active projects at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project._id}
              className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                  <FolderKanban className="w-6 h-6 text-white" />
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  Active
                </span>
              </div>

              <h3 className="text-xl font-semibold text-foreground mb-2">{project.title}</h3>
              <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{project.description}</p>

              <div className="space-y-2 mb-4 text-sm">
                {project.location && (
                  <div className="text-muted-foreground">
                    <strong>Location:</strong> {project.location}
                  </div>
                )}
                {project.coordinator && (
                  <div className="text-muted-foreground">
                    <strong>Coordinator:</strong> {project.coordinator}
                  </div>
                )}
                {project.maxVolunteers && (
                  <div className="text-muted-foreground">
                    <strong>Volunteers:</strong> {project.currentVolunteers}/{project.maxVolunteers}
                  </div>
                )}
              </div>

              <button
                onClick={() => handleSelectProject(project._id)}
                disabled={selecting || (project.maxVolunteers ? project.currentVolunteers >= project.maxVolunteers : false)}
                className="w-full flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {selecting ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4 mr-2" />
                    Selecting...
                  </>
                ) : (
                  <>
                    Select Project
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

