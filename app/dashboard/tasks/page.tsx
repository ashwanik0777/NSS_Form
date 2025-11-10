"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Calendar,
  Flag,
  FileText,
  XCircle,
} from "lucide-react"

interface Task {
  _id: string
  title: string
  description: string
  assignedBy: {
    _id: string
    name: string
    email: string
  }
  unitNo: string
  status: "pending" | "in-progress" | "completed" | "cancelled"
  priority: "low" | "medium" | "high" | "urgent"
  dueDate?: string
  completedAt?: string
  completionNotes?: string
  createdAt: string
  updatedAt: string
}

export default function TasksPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "pending" | "in-progress" | "completed">("all")
  const [updatingTask, setUpdatingTask] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.replace("/login")
      return
    }
    fetchTasks()
  }, [session, status, router, filter])

  const fetchTasks = async () => {
    try {
      const statusParam = filter !== "all" ? `&status=${filter}` : ""
      const res = await fetch(`/api/volunteer/tasks?${statusParam}`)
      const data = await res.json()
      if (data.success) {
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    setUpdatingTask(taskId)
    try {
      const res = await fetch("/api/volunteer/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: newStatus }),
      })

      const data = await res.json()
      if (data.success) {
        fetchTasks()
      } else {
        alert(data.message || "Failed to update task")
      }
    } catch (error) {
      console.error("Error updating task:", error)
      alert("Failed to update task")
    } finally {
      setUpdatingTask(null)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "cancelled":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    )
  }

  const pendingTasks = tasks.filter((t) => t.status === "pending").length
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress").length
  const completedTasks = tasks.filter((t) => t.status === "completed").length

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          My Tasks
        </h1>
        <p className="text-muted-foreground mt-2">View and manage your assigned tasks</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
              <p className="text-2xl font-bold text-foreground mt-1">{tasks.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold text-foreground mt-1">{pendingTasks}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">In Progress</p>
              <p className="text-2xl font-bold text-foreground mt-1">{inProgressTasks}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-foreground mt-1">{completedTasks}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">Filter:</span>
          {(["all", "pending", "in-progress", "completed"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {status === "all"
                ? "All Tasks"
                : status === "in-progress"
                  ? "In Progress"
                  : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div
              key={task._id}
              className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-foreground">{task.title}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                        task.priority
                      )}`}
                    >
                      <Flag className="w-3 h-3 inline mr-1" />
                      {task.priority}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                    >
                      {task.status === "in-progress" ? "In Progress" : task.status}
                    </span>
                  </div>
                  <p className="text-muted-foreground mb-3">{task.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Assigned: {new Date(task.createdAt).toLocaleDateString()}</span>
                    </div>
                    {task.dueDate && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Due: {new Date(task.dueDate).toLocaleString()}</span>
                      </div>
                    )}
                    {task.completedAt && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>Completed: {new Date(task.completedAt).toLocaleString()}</span>
                      </div>
                    )}
                    <div>
                      <span>Assigned by: {task.assignedBy.name}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {task.status !== "completed" && task.status !== "cancelled" && (
                <div className="flex gap-2 pt-4 border-t border-border">
                  {task.status === "pending" && (
                    <button
                      onClick={() => handleUpdateStatus(task._id, "in-progress")}
                      disabled={updatingTask === task._id}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                    >
                      {updatingTask === task._id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          Start Task
                        </>
                      )}
                    </button>
                  )}
                  {task.status === "in-progress" && (
                    <button
                      onClick={() => handleUpdateStatus(task._id, "completed")}
                      disabled={updatingTask === task._id}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                      {updatingTask === task._id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Mark as Completed
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {task.status === "completed" && (
                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Task completed successfully
                  </p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-foreground mb-2">No tasks found</p>
            <p className="text-muted-foreground">
              {filter === "all"
                ? "You don't have any tasks assigned yet."
                : `You don't have any ${filter} tasks.`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}


