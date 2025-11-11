"use client"

import { useEffect, useState } from "react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { Loader2, X, CheckCircle2, Filter } from "lucide-react"

export default function AdminGrievancesPage() {
  const [grievances, setGrievances] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({ status: "all", unitNo: "all" })
  const [units, setUnits] = useState<string[]>([])
  const [editing, setEditing] = useState<any | null>(null)
  const [form, setForm] = useState({ status: "in-progress", adminNotes: "", resolutionNotes: "" })

  const loadUnits = async () => {
    try {
      const res = await fetch("/api/admin/users")
      const data = await res.json()
      if (data.success && data.users) {
        const allUnits = new Set<string>()
        data.users.forEach((user: any) => {
          if (user.assignedUnits && Array.isArray(user.assignedUnits)) {
            user.assignedUnits.forEach((u: string) => allUnits.add(u))
          }
        })
        setUnits(Array.from(allUnits).sort())
      }
    } catch {}
  }

  const load = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.status && filters.status !== "all") params.set("status", filters.status)
      if (filters.unitNo && filters.unitNo !== "all") params.set("unitNo", filters.unitNo)
      const res = await fetch(`/api/admin/grievances?${params.toString()}`)
      const data = await res.json()
      if (data.success) setGrievances(data.grievances || [])
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUnits()
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters])

  const update = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/grievances", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grievanceId: editing._id,
          status: form.status,
          adminNotes: form.adminNotes,
          resolutionNotes: form.resolutionNotes,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setEditing(null)
        setForm({ status: "in-progress", adminNotes: "", resolutionNotes: "" })
        load()
      } else {
        setError(data.message || "Failed to update grievance")
      }
    } catch (e) {
      setError("Failed to update grievance")
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
    <ProtectedRoute requiredRole="sub-admin" requiredPermission="volunteers.view">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Grievances</h1>
            <p className="text-muted-foreground mt-1">Review and resolve student grievances</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 border border-border rounded-lg text-sm"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={filters.unitNo}
                onChange={(e) => setFilters({ ...filters, unitNo: e.target.value })}
                className="px-3 py-2 border border-border rounded-lg text-sm"
              >
                <option value="all">All Units</option>
                {units.map((u) => (
                  <option key={u} value={u}>
                    Unit {u}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Student</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Unit</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Subject</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Created</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {grievances.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      No grievances found for selected filters.
                    </td>
                  </tr>
                ) : (
                  grievances.map((g) => (
                    <tr key={g._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium text-foreground">{g.user?.name || "Unknown"}</div>
                        <div className="text-xs text-muted-foreground">{g.user?.email}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">{g.unitNo || "—"}</td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-foreground">{g.subject}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">{g.description}</p>
                        </div>
                      </td>
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
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setEditing(g)
                            setForm({
                              status: g.status === "resolved" ? "resolved" : "in-progress",
                              adminNotes: g.adminNotes || "",
                              resolutionNotes: g.resolutionNotes || "",
                            })
                            setError(null)
                          }}
                          className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {editing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl border border-border max-w-xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Update Grievance</h2>
                <button
                  onClick={() => setEditing(null)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>}

              <form onSubmit={update} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Admin Notes</label>
                    <input
                      type="text"
                      value={form.adminNotes}
                      onChange={(e) => setForm({ ...form, adminNotes: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Internal remarks"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">Resolution Notes</label>
                    <textarea
                      rows={3}
                      value={form.resolutionNotes}
                      onChange={(e) => setForm({ ...form, resolutionNotes: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Details of resolution to share with student"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}


