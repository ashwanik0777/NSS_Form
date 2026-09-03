"use client"

import { useEffect, useState } from "react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import AdminHeader from "@/components/admin/AdminHeader"
import {
  Users,
  Loader2,
  UserX,
  AlertTriangle,
  Search,
} from "lucide-react"

export default function PastVolunteersPage() {
  const [pastVolunteers, setPastVolunteers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [unitNo, setUnitNo] = useState("all")
  const [nameSearch, setNameSearch] = useState("")

  useEffect(() => {
    fetchPastVolunteers()
  }, [unitNo, nameSearch])

  const fetchPastVolunteers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      params.set('type', 'past')
      if (unitNo !== 'all') params.set('unitNo', unitNo)
      if (nameSearch) params.set('nameSearch', nameSearch)
      
      const res = await fetch(`/api/admin/volunteer-management?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setPastVolunteers(data.volunteers || [])
      }
    } catch (error) {
      console.error("Error fetching past volunteers:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute requiredRole="sub-admin" requiredPermission="volunteers.view">
      <AdminHeader title="Past Volunteers" subtitle="History of deactivated or removed volunteers" />
      
      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name..."
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={unitNo}
              onChange={(e) => setUnitNo(e.target.value)}
              className="px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Units</option>
              {[1, 2, 3, 4, 5, 6].map(num => (
                <option key={num} value={num.toString()}>Unit {num}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-red-50 dark:bg-red-950/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-400">Removed Volunteers History</h3>
              <span className="text-xs text-red-600 dark:text-red-400">These volunteers have been deactivated and cannot login.</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Volunteer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Unit</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Removal Reason</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Removed On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 className="animate-spin w-8 h-8 text-primary mx-auto" />
                    </td>
                  </tr>
                ) : pastVolunteers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <UserX className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-medium text-foreground">No removed volunteers</h3>
                      <p className="mt-1 text-sm text-muted-foreground">No volunteers have been removed yet.</p>
                    </td>
                  </tr>
                ) : (
                  pastVolunteers.map((vol: any) => (
                    <tr key={vol._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-foreground">{vol.name}</p>
                          <p className="text-sm text-muted-foreground">{vol.email}</p>
                          {vol.mobileNo && <p className="text-xs text-muted-foreground">{vol.mobileNo}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          {vol.unitNo || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">{vol.departmentName || "—"}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-foreground max-w-xs truncate" title={vol.removalReason}>{vol.removalReason || "—"}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {vol.removedAt ? new Date(vol.removedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
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
