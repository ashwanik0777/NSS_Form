"use client"

import { useEffect, useState } from "react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { Loader2, Send, PlusCircle } from "lucide-react"

export default function VolunteerGrievancesPage() {
  const [grievances, setGrievances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    category: "",
    priority: "medium",
  })

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/volunteer/grievances")
      const data = await res.json()
      if (data.success) setGrievances(data.grievances || [])
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      if (!formData.subject || !formData.description) {
        setError("Please fill all required fields")
        setSubmitting(false)
        return
      }
      const res = await fetch("/api/volunteer/grievances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success) {
        setShowForm(false)
        setFormData({ subject: "", description: "", category: "", priority: "medium" })
        load()
      } else {
        setError(data.message || "Failed to submit grievance")
      }
    } catch (e) {
      setError("Failed to submit grievance")
    } finally {
      setSubmitting(false)
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
    <ProtectedRoute requiredRole="volunteer">
      <div className="p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Grievance Portal</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">Submit and track your grievances</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium shadow-xs"
          >
            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            New Grievance
          </button>
        </div>

        {showForm && (
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Submit Grievance</h3>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}
            <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Subject *</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder="Brief title of the grievance"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">Description *</label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder="Provide details of your grievance"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  placeholder="e.g., Hostel, Academic, Facilities"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setError(null)
                  }}
                  className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors text-sm"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Submit
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Mobile Cards View (below md) */}
        <div className="md:hidden space-y-3">
          {grievances.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground bg-card rounded-xl border border-border text-sm">
              No grievances yet. Tap "New Grievance" above to submit one.
            </div>
          ) : (
            grievances.map((g) => (
              <div key={g._id} className="bg-card rounded-xl border border-border p-4 space-y-2 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground text-sm flex-1">{g.subject}</h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${
                      g.status === "open"
                        ? "bg-blue-100 text-blue-800"
                        : g.status === "in-progress"
                          ? "bg-yellow-100 text-yellow-800"
                          : g.status === "resolved"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {g.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">{g.description}</p>
                <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/60 gap-1">
                  <span>Category: <strong className="text-foreground">{g.category || "—"}</strong></span>
                  <span className="capitalize">Priority: <strong className="text-foreground">{g.priority}</strong></span>
                  <span>{new Date(g.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Table View (md and above) */}
        <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Subject</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Priority</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {grievances.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No grievances yet. Click "New Grievance" to submit one.
                    </td>
                  </tr>
                ) : (
                  grievances.map((g) => (
                    <tr key={g._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-foreground">{g.subject}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{g.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">{g.category || "—"}</td>
                      <td className="px-6 py-4 text-sm capitalize">{g.priority}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            g.status === "open"
                              ? "bg-blue-100 text-blue-800"
                              : g.status === "in-progress"
                                ? "bg-yellow-100 text-yellow-800"
                                : g.status === "resolved"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {g.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(g.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}


