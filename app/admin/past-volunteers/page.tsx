"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import AdminHeader from "@/components/admin/AdminHeader"
import {
  Users,
  Loader2,
  UserX,
  AlertTriangle,
  Search,
  X,
} from "lucide-react"

export default function PastVolunteersPage() {
  const [pastVolunteers, setPastVolunteers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [unitNo, setUnitNo] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isTableLoading, setIsTableLoading] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!value.trim()) {
      setDebouncedSearch("")
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value.trim())
      setIsSearching(false)
    }, 250)
  }

  const handleClearSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    setSearchQuery("")
    setDebouncedSearch("")
    setIsSearching(false)
  }

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const displayPastVolunteers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return pastVolunteers
    }

    const digitsOnly = query.replace(/\D/g, "")

    const filtered = pastVolunteers.filter((vol) => {
      const name = (vol.name || "").toLowerCase()
      const email = (vol.email || "").toLowerCase()
      const mobile = (vol.mobileNo || "").toLowerCase()
      const mobileDigits = mobile.replace(/\D/g, "")
      const unit = (vol.unitNo || "").toLowerCase()
      const dept = (vol.departmentName || "").toLowerCase()
      const school = (vol.schoolName || "").toLowerCase()
      const reason = (vol.removalReason || "").toLowerCase()

      return (
        name.includes(query) ||
        email.includes(query) ||
        mobile.includes(query) ||
        (digitsOnly.length >= 3 && mobileDigits.includes(digitsOnly)) ||
        unit.includes(query) ||
        dept.includes(query) ||
        school.includes(query) ||
        reason.includes(query)
      )
    })

    if (debouncedSearch.toLowerCase() === query) {
      return pastVolunteers
    }

    if (filtered.length > 0) {
      return filtered
    }

    return pastVolunteers
  }, [pastVolunteers, searchQuery, debouncedSearch])

  useEffect(() => {
    fetchPastVolunteers()
  }, [unitNo, debouncedSearch])

  const fetchPastVolunteers = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      if (pastVolunteers.length === 0) {
        setLoading(true)
      } else {
        setIsTableLoading(true)
      }

      const params = new URLSearchParams()
      params.set('type', 'past')
      if (unitNo !== 'all') params.set('unitNo', unitNo)
      if (debouncedSearch) {
        params.set('search', debouncedSearch)
        params.set('nameSearch', debouncedSearch)
      }
      
      const res = await fetch(`/api/admin/volunteer-management?${params.toString()}`, {
        signal: controller.signal
      })
      const data = await res.json()
      if (data.success) {
        setPastVolunteers(data.volunteers || [])
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return
      }
      console.error("Error fetching past volunteers:", error)
    } finally {
      setLoading(false)
      setIsTableLoading(false)
      setIsSearching(false)
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, email, or number..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-border rounded-lg bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"
              />
              {isSearching || isTableLoading ? (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
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
        <div className="bg-card rounded-xl border border-border overflow-hidden relative">
          {isTableLoading && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden z-10">
              <div className="h-full bg-primary animate-pulse w-full" />
            </div>
          )}
          <div className="p-4 border-b border-border bg-red-50 dark:bg-red-950/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-400">Removed Volunteers History</h3>
              <span className="text-xs text-red-600 dark:text-red-400">These volunteers have been deactivated and cannot login.</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className={`w-full transition-opacity duration-150 ${isTableLoading ? "opacity-75" : "opacity-100"}`}>
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
                {loading && pastVolunteers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <Loader2 className="animate-spin w-8 h-8 text-primary mx-auto" />
                    </td>
                  </tr>
                ) : displayPastVolunteers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <UserX className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-medium text-foreground">
                        {searchQuery ? "No removed volunteers match your search" : "No removed volunteers"}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {searchQuery
                          ? `No records found for "${searchQuery}". Try searching by name, email, or number.`
                          : "No volunteers have been removed yet."}
                      </p>
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={handleClearSearch}
                          className="mt-3 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors border border-primary/20"
                        >
                          Clear search
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  displayPastVolunteers.map((vol: any) => (
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
