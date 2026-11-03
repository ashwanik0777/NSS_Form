"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import AdminHeader from "@/components/admin/AdminHeader"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  UserX,
  AlertTriangle,
  Search,
  X,
  Download,
  RotateCcw,
  RefreshCw,
  Shield,
  Check,
  FileSpreadsheet,
  FileText,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react"

// All exportable past volunteer fields grouped by category
const EXPORT_FIELD_GROUPS = [
  {
    category: "Basic Information",
    fields: [
      { key: "name", label: "Volunteer Name" },
      { key: "email", label: "Email Address" },
      { key: "mobileNo", label: "Mobile Number" },
      { key: "unitNo", label: "Unit Number" },
    ],
  },
  {
    category: "Removal Details",
    fields: [
      { key: "removalReason", label: "Removal Reason" },
      { key: "removedAt", label: "Removed Date" },
      { key: "removedBy", label: "Removed By" },
    ],
  },
  {
    category: "Academic Details",
    fields: [
      { key: "schoolName", label: "School" },
      { key: "departmentName", label: "Department" },
      { key: "courseName", label: "Course" },
      { key: "year", label: "Enrollment Year" },
      { key: "rollNumber", label: "Roll / Form Number" },
      { key: "highSchoolRollNo", label: "High School Roll No" },
      { key: "classSemester", label: "Class / Semester" },
    ],
  },
  {
    category: "Personal Details",
    fields: [
      { key: "fatherName", label: "Father's Name" },
      { key: "motherName", label: "Mother's Name" },
      { key: "dob", label: "Date of Birth" },
      { key: "gender", label: "Gender" },
      { key: "category", label: "Category" },
      { key: "bloodGroup", label: "Blood Group" },
      { key: "addressType", label: "Address Type" },
      { key: "hostelAddress", label: "Hostel Address" },
      { key: "homeAddress", label: "Home Address" },
    ],
  },
  {
    category: "NSS Details",
    fields: [
      { key: "programOfficerName", label: "Program Officer" },
      { key: "nssEnrollmentYear", label: "NSS Enrollment Year" },
      { key: "myBharatRegistered", label: "My Bharat Registered" },
      { key: "myBharatPortalId", label: "My Bharat ID" },
    ],
  },
]

const ALL_EXPORT_KEYS = EXPORT_FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.key))
const DEFAULT_EXPORT_KEYS = [
  "name",
  "email",
  "mobileNo",
  "unitNo",
  "departmentName",
  "schoolName",
  "removalReason",
  "removedAt",
]

export default function PastVolunteersPage() {
  const { data: session } = useSession()
  const isSuperAdmin = (session?.user as any)?.role === "admin"
  const { toast } = useToast()

  const [pastVolunteers, setPastVolunteers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [unitNo, setUnitNo] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isTableLoading, setIsTableLoading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportUnit, setExportUnit] = useState<string>("all")
  const [exportFormat, setExportFormat] = useState<"excel" | "pdf">("excel")
  const [exportFields, setExportFields] = useState<string[]>([])
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null)

  // Reinstate Modal State (Super Admin Only)
  const [selectedVolunteerForReinstate, setSelectedVolunteerForReinstate] = useState<any | null>(null)
  const [reinstateUnit, setReinstateUnit] = useState<string>("1")
  const [unitCapacities, setUnitCapacities] = useState<any[]>([])
  const [loadingCapacities, setLoadingCapacities] = useState(false)
  const [isReinstating, setIsReinstating] = useState(false)

  // Free Modal State (Super Admin Only)
  const [selectedVolunteerForFree, setSelectedVolunteerForFree] = useState<any | null>(null)
  const [isFreeing, setIsFreeing] = useState(false)

  // Instant keystroke handler (synchronous in-memory search)
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  const handleClearSearch = () => {
    setSearchQuery("")
  }

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // In-memory search across all past volunteer fields
  const displayPastVolunteers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return pastVolunteers
    }

    const digitsOnly = query.replace(/\D/g, "")

    return pastVolunteers.filter((vol) => {
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
  }, [pastVolunteers, searchQuery])

  useEffect(() => {
    fetchPastVolunteers()
  }, [unitNo])

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
      params.set("type", "past")
      params.set("limit", "1000")
      if (unitNo !== "all") params.set("unitNo", unitNo)

      const res = await fetch(`/api/admin/volunteer-management?${params.toString()}`, {
        signal: controller.signal,
      })
      const data = await res.json()
      if (data.success) {
        setPastVolunteers(data.volunteers || [])
      }
    } catch (error: any) {
      if (error?.name === "AbortError") {
        return
      }
      console.error("Error fetching past volunteers:", error)
    } finally {
      setLoading(false)
      setIsTableLoading(false)
    }
  }

  // Open Export Modal
  const openExportModal = () => {
    if (exportFields.length === 0) {
      setExportFields([...DEFAULT_EXPORT_KEYS])
    }
    setExportUnit(unitNo)
    setShowExportModal(true)
  }

  const toggleExportField = (key: string) => {
    setExportFields((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const toggleGroupFields = (keys: string[], select: boolean) => {
    if (select) {
      setExportFields((prev) => [...new Set([...prev, ...keys])])
    } else {
      setExportFields((prev) => prev.filter((k) => !keys.includes(k)))
    }
  }

  // Handle Export Download
  const handleExport = async () => {
    if (exportFields.length === 0) {
      toast({
        title: "No fields selected",
        description: "Please select at least one field to export.",
        variant: "destructive",
      })
      return
    }

    try {
      setExporting(exportFormat)
      const params = new URLSearchParams()
      params.set("type", "past")
      params.set("format", exportFormat)
      if (exportUnit !== "all") params.set("unitNo", exportUnit)
      if (searchQuery.trim()) params.set("search", searchQuery.trim())
      params.set("fields", exportFields.join(","))

      const res = await fetch(`/api/admin/volunteer-management?${params.toString()}`)
      if (!res.ok) {
        throw new Error("Failed to export past volunteers")
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const fileNameBase =
        exportUnit !== "all" ? `past_volunteers_unit_${exportUnit}` : "past_volunteers_all_units"
      a.download = `${fileNameBase}.${exportFormat === "excel" ? "xls" : "pdf"}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Export Successful",
        description: `Past volunteers exported as ${exportFormat.toUpperCase()}.`,
      })
      setShowExportModal(false)
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export past volunteers data.",
        variant: "destructive",
      })
    } finally {
      setExporting(null)
    }
  }

  // Open Reinstate Modal (Super Admin)
  const openReinstateModal = async (vol: any) => {
    setSelectedVolunteerForReinstate(vol)
    setReinstateUnit(vol.unitNo && ["1", "2", "3", "4", "5", "6"].includes(vol.unitNo) ? vol.unitNo : "1")
    setLoadingCapacities(true)
    try {
      const res = await fetch("/api/applications/transfer-unit")
      const data = await res.json()
      if (data.success && data.units) {
        setUnitCapacities(data.units)
      }
    } catch (err) {
      console.error("Failed to load unit capacities:", err)
    } finally {
      setLoadingCapacities(false)
    }
  }

  // Confirm Reinstate Action
  const handleConfirmReinstate = async () => {
    if (!selectedVolunteerForReinstate) return
    setIsReinstating(true)
    try {
      const res = await fetch("/api/admin/past-volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reinstate",
          volunteerId: selectedVolunteerForReinstate._id,
          applicationId: selectedVolunteerForReinstate.applicationId,
          unitNo: reinstateUnit,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({
          title: "Volunteer Reinstated",
          description: data.message || `Volunteer reinstated successfully to Unit ${reinstateUnit}.`,
        })
        setPastVolunteers((prev) =>
          prev.filter((v) => v._id !== selectedVolunteerForReinstate._id)
        )
        setSelectedVolunteerForReinstate(null)
      } else {
        toast({
          title: "Reinstatement Failed",
          description: data.message || "Failed to reinstate volunteer.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      })
    } finally {
      setIsReinstating(false)
    }
  }

  // Confirm Free for Re-registration Action
  const handleConfirmFree = async () => {
    if (!selectedVolunteerForFree) return
    setIsFreeing(true)
    try {
      const res = await fetch("/api/admin/past-volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "free",
          volunteerId: selectedVolunteerForFree._id,
          applicationId: selectedVolunteerForFree.applicationId,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({
          title: "Volunteer Released",
          description: data.message || "Past records freed. Volunteer can now re-register.",
        })
        setPastVolunteers((prev) =>
          prev.filter((v) => v._id !== selectedVolunteerForFree._id)
        )
        setSelectedVolunteerForFree(null)
      } else {
        toast({
          title: "Action Failed",
          description: data.message || "Failed to free volunteer record.",
          variant: "destructive",
        })
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Something went wrong.",
        variant: "destructive",
      })
    } finally {
      setIsFreeing(false)
    }
  }

  return (
    <ProtectedRoute requiredRole="sub-admin" requiredPermission="volunteers.view">
      <AdminHeader title="Past Volunteers" subtitle="History of deactivated or removed volunteers" />

      <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Super Admin Notice (if Super Admin) */}
        {isSuperAdmin && (
          <div className="flex items-center justify-between flex-wrap gap-2 px-3.5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary font-medium">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary shrink-0" />
              <span>
                <strong>Super Admin Privileges:</strong> You can reinstate volunteers back into any unit or free them to register anew.
              </span>
            </div>
            <span className="text-[11px] bg-primary/20 px-2 py-0.5 rounded-full font-semibold">
              Super Admin Active
            </span>
          </div>
        )}

        {/* Filters & Actions Bar */}
        <div className="bg-card rounded-xl border border-border p-3 sm:p-4 shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 sm:gap-4 items-center">
            {/* Search Input */}
            <div className="sm:col-span-6 md:col-span-7 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search by name, email, or number..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 border border-border rounded-lg bg-input text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-muted-foreground/60"
              />
              {isTableLoading ? (
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

            {/* Unit Selector */}
            <div className="sm:col-span-3 md:col-span-3">
              <select
                value={unitNo}
                onChange={(e) => setUnitNo(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Units</option>
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num.toString()}>
                    Unit {num}
                  </option>
                ))}
              </select>
            </div>

            {/* Export Button */}
            <div className="sm:col-span-3 md:col-span-2 flex justify-end">
              <button
                type="button"
                onClick={openExportModal}
                disabled={exporting !== null}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-xs disabled:opacity-50"
                title="Export Past Volunteers"
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Export Past Volunteers</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Cards View (block md:hidden) */}
        <div className="block md:hidden space-y-2.5">
          <div className="p-3 rounded-xl border border-border bg-red-50/80 dark:bg-red-950/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <h3 className="text-xs font-semibold text-red-800 dark:text-red-400">
                Removed Volunteers History
              </h3>
            </div>
            <p className="text-[11px] text-red-600/90 dark:text-red-400/90 mt-0.5 ml-6">
              These volunteers have been deactivated and cannot login.
            </p>
          </div>

          {loading && pastVolunteers.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center shadow-xs">
              <Loader2 className="animate-spin w-6 h-6 text-primary mx-auto" />
              <p className="text-xs text-muted-foreground mt-2">Loading past volunteers...</p>
            </div>
          ) : displayPastVolunteers.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center shadow-xs">
              <UserX className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">
                {searchQuery ? "No matching records" : "No removed volunteers"}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {searchQuery
                  ? `No records found for "${searchQuery}".`
                  : "No volunteers have been removed."}
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
            </div>
          ) : (
            displayPastVolunteers.map((vol: any) => (
              <div
                key={vol._id}
                className="bg-card rounded-xl border border-border p-3.5 shadow-xs hover:border-primary/40 transition-colors space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{vol.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{vol.email}</p>
                    {vol.mobileNo && (
                      <p className="text-[11px] text-muted-foreground font-mono">{vol.mobileNo}</p>
                    )}
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-900/40 shrink-0">
                    {vol.unitNo ? `Unit ${vol.unitNo}` : "—"}
                  </span>
                </div>

                {vol.departmentName && (
                  <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-2.5 py-1">
                    <span className="text-foreground font-medium">{vol.departmentName}</span>
                  </div>
                )}

                {vol.removalReason && (
                  <div className="text-xs p-2 rounded-lg bg-red-50/70 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-300">
                    <span className="font-semibold text-[11px]">Reason: </span>
                    <span>{vol.removalReason}</span>
                  </div>
                )}

                <div className="text-[11px] text-muted-foreground text-right pt-1 border-t border-border/50">
                  Removed on:{" "}
                  {vol.removedAt
                    ? new Date(vol.removedAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </div>

                {/* Super Admin Actions (Mobile) */}
                {isSuperAdmin && (
                  <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedVolunteerForFree(vol)}
                      className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 dark:text-amber-300 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 border border-amber-200 dark:border-amber-800/40 rounded-lg transition-colors"
                      title="Free to re-register anew"
                    >
                      <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                      <span>Free to Re-register</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openReinstateModal(vol)}
                      className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/40 rounded-lg transition-colors"
                      title="Reinstate volunteer and select unit"
                    >
                      <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                      <span>Reinstate</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Desktop Table (hidden on mobile) */}
        <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden relative shadow-xs">
          {isTableLoading && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden z-10">
              <div className="h-full bg-primary animate-pulse w-full" />
            </div>
          )}
          <div className="p-4 border-b border-border bg-red-50 dark:bg-red-950/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-400">
                Removed Volunteers History
              </h3>
              <span className="text-xs text-red-600 dark:text-red-400">
                These volunteers have been deactivated and cannot login.
              </span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table
              className={`w-full transition-opacity duration-150 ${
                isTableLoading ? "opacity-75" : "opacity-100"
              }`}
            >
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Volunteer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Unit</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Removal Reason</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Removed On</th>
                  {isSuperAdmin && (
                    <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
                      Super Admin Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading && pastVolunteers.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 6 : 5} className="px-6 py-12 text-center">
                      <Loader2 className="animate-spin w-8 h-8 text-primary mx-auto" />
                    </td>
                  </tr>
                ) : displayPastVolunteers.length === 0 ? (
                  <tr>
                    <td colSpan={isSuperAdmin ? 6 : 5} className="px-6 py-12 text-center">
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
                          {vol.mobileNo && (
                            <p className="text-xs text-muted-foreground font-mono">{vol.mobileNo}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          {vol.unitNo ? `Unit ${vol.unitNo}` : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">{vol.departmentName || "—"}</td>
                      <td className="px-6 py-4">
                        <p
                          className="text-sm text-foreground max-w-xs truncate"
                          title={vol.removalReason}
                        >
                          {vol.removalReason || "—"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {vol.removedAt
                          ? new Date(vol.removedAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      {isSuperAdmin && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedVolunteerForFree(vol)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 dark:text-amber-300 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 border border-amber-200 dark:border-amber-800/40 rounded-lg transition-colors shadow-2xs"
                              title="Free this volunteer's records so they can register again on the portal"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Free to Re-register</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openReinstateModal(vol)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/40 rounded-lg transition-colors shadow-2xs"
                              title="Reinstate volunteer directly with unit change option"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Reinstate</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===================== EXPORT MODAL ===================== */}
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
            <div className="bg-card border border-border rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Export Past Volunteers</h2>
                    <p className="text-xs text-muted-foreground">
                      Download past volunteer archives in Excel or PDF format
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Unit Selection */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Select Unit Scope
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  <label
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      exportUnit === "all"
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportUnit"
                      value="all"
                      checked={exportUnit === "all"}
                      onChange={(e) => setExportUnit(e.target.value)}
                      className="sr-only"
                    />
                    <span>All Units</span>
                  </label>
                  {[1, 2, 3, 4, 5, 6].map((unit) => (
                    <label
                      key={unit}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                        exportUnit === unit.toString()
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border hover:bg-muted/50 text-foreground"
                      }`}
                    >
                      <input
                        type="radio"
                        name="exportUnit"
                        value={unit.toString()}
                        checked={exportUnit === unit.toString()}
                        onChange={(e) => setExportUnit(e.target.value)}
                        className="sr-only"
                      />
                      <span>Unit {unit}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Fields Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Select Fields to Export ({exportFields.length} of {ALL_EXPORT_KEYS.length})
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setExportFields([...ALL_EXPORT_KEYS])}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-muted-foreground text-xs">•</span>
                    <button
                      type="button"
                      onClick={() => setExportFields([])}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="space-y-3 max-h-56 overflow-y-auto pr-1 border border-border rounded-lg p-3 bg-muted/20">
                  {EXPORT_FIELD_GROUPS.map((group) => {
                    const groupKeys = group.fields.map((f) => f.key)
                    const allSelected = groupKeys.every((k) => exportFields.includes(k))
                    const someSelected = groupKeys.some((k) => exportFields.includes(k))

                    return (
                      <div key={group.category} className="space-y-1.5">
                        <div className="flex items-center justify-between bg-muted/50 px-2 py-1 rounded text-xs font-medium text-foreground">
                          <span>{group.category}</span>
                          <button
                            type="button"
                            onClick={() => toggleGroupFields(groupKeys, !allSelected)}
                            className="text-[11px] text-primary hover:underline"
                          >
                            {allSelected ? "None" : someSelected ? "All" : "Select"}
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2">
                          {group.fields.map((field) => (
                            <label
                              key={field.key}
                              className="flex items-center gap-2 text-xs text-foreground cursor-pointer hover:text-primary transition-colors py-0.5"
                            >
                              <input
                                type="checkbox"
                                checked={exportFields.includes(field.key)}
                                onChange={() => toggleExportField(field.key)}
                                className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                              />
                              <span>{field.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Export Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      exportFormat === "excel"
                        ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 font-semibold"
                        : "border-border hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportFormat"
                      value="excel"
                      checked={exportFormat === "excel"}
                      onChange={(e) => setExportFormat(e.target.value as "excel" | "pdf")}
                      className="sr-only"
                    />
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-medium">Microsoft Excel (.xls)</p>
                      <p className="text-[11px] text-muted-foreground font-normal">Spreadsheet table</p>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      exportFormat === "pdf"
                        ? "border-red-500 bg-red-50/80 dark:bg-red-950/30 text-red-800 dark:text-red-300 font-semibold"
                        : "border-border hover:bg-muted/50 text-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportFormat"
                      value="pdf"
                      checked={exportFormat === "pdf"}
                      onChange={(e) => setExportFormat(e.target.value as "excel" | "pdf")}
                      className="sr-only"
                    />
                    <FileText className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                      <p className="text-xs font-medium">PDF Document (.pdf)</p>
                      <p className="text-[11px] text-muted-foreground font-normal">Printable format</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 border border-border rounded-lg text-xs sm:text-sm font-medium hover:bg-muted transition-colors text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting !== null || exportFields.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download {exportFormat.toUpperCase()}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== REINSTATE MODAL (SUPER ADMIN ONLY) ===================== */}
        {selectedVolunteerForReinstate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
            <div className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-foreground">
                      Reinstate Past Volunteer
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Restore active status and choose target unit
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVolunteerForReinstate(null)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Volunteer Info Card */}
              <div className="p-3.5 bg-muted/40 rounded-xl border border-border space-y-1">
                <p className="font-semibold text-sm text-foreground">
                  {selectedVolunteerForReinstate.name}
                </p>
                <p className="text-xs text-muted-foreground">{selectedVolunteerForReinstate.email}</p>
                {selectedVolunteerForReinstate.mobileNo && (
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedVolunteerForReinstate.mobileNo}
                  </p>
                )}
                <div className="pt-1 flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Previous Unit:</span>
                  <span className="font-semibold text-foreground">
                    {selectedVolunteerForReinstate.unitNo ? `Unit ${selectedVolunteerForReinstate.unitNo}` : "None"}
                  </span>
                </div>
                {selectedVolunteerForReinstate.removalReason && (
                  <p className="text-[11px] text-red-600 dark:text-red-400 pt-1 italic">
                    Reason: {selectedVolunteerForReinstate.removalReason}
                  </p>
                )}
              </div>

              {/* Target Unit Selection */}
              <div>
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
                  Assign to Unit
                </label>
                {loadingCapacities ? (
                  <div className="flex items-center justify-center p-6 bg-muted/20 rounded-xl border border-border">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground ml-2">Loading unit capacity...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {[1, 2, 3, 4, 5, 6].map((num) => {
                      const strNum = num.toString()
                      const unitInfo = unitCapacities.find((u) => u.unitNo === strNum)
                      const isFull = unitInfo ? unitInfo.isFull : false
                      const count = unitInfo ? unitInfo.count : 0
                      const isSelected = reinstateUnit === strNum

                      return (
                        <button
                          key={num}
                          type="button"
                          disabled={isFull}
                          onClick={() => setReinstateUnit(strNum)}
                          className={`p-3 rounded-xl border text-left transition-all relative ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30"
                              : isFull
                              ? "border-border bg-muted/40 opacity-50 cursor-not-allowed"
                              : "border-border hover:border-emerald-500/50 hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">Unit {num}</span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            )}
                          </div>
                          <div className="mt-1 text-[11px] text-muted-foreground">
                            {isFull ? (
                              <span className="text-red-600 dark:text-red-400 font-medium">Full (100/100)</span>
                            ) : (
                              <span>{count} / 100 occupied</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Information Alert */}
              <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <Info className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>Immediate Reinstatement</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  The volunteer will be assigned to <strong>Unit {reinstateUnit}</strong> and restored to active volunteer status. They will be able to log in immediately with their existing credentials.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedVolunteerForReinstate(null)}
                  className="px-4 py-2 border border-border rounded-lg text-xs sm:text-sm font-medium hover:bg-muted transition-colors text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmReinstate}
                  disabled={isReinstating}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isReinstating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Reinstating...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Reinstate to Unit {reinstateUnit}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================== FREE FOR RE-REGISTRATION MODAL (SUPER ADMIN ONLY) ===================== */}
        {selectedVolunteerForFree && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
            <div className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in-50 zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-foreground">
                      Free for Re-registration
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Release records to allow student to register fresh
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVolunteerForFree(null)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Volunteer Info Card */}
              <div className="p-3.5 bg-muted/40 rounded-xl border border-border space-y-1">
                <p className="font-semibold text-sm text-foreground">
                  {selectedVolunteerForFree.name}
                </p>
                <p className="text-xs text-muted-foreground">{selectedVolunteerForFree.email}</p>
                {selectedVolunteerForFree.mobileNo && (
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedVolunteerForFree.mobileNo}
                  </p>
                )}
                <div className="pt-1 flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">Previous Unit:</span>
                  <span className="font-semibold text-foreground">
                    {selectedVolunteerForFree.unitNo ? `Unit ${selectedVolunteerForFree.unitNo}` : "None"}
                  </span>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-900 dark:text-amber-300 space-y-2">
                <div className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>How This Option Works</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  This action will permanently delete this past removed application and deactivate blocks for this user.
                </p>
                <p className="text-[11px] leading-relaxed">
                  The student will be <strong>free to submit a brand new application</strong> from the public registration portal (<code className="bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">/register</code>) using their email and phone number.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedVolunteerForFree(null)}
                  className="px-4 py-2 border border-border rounded-lg text-xs sm:text-sm font-medium hover:bg-muted transition-colors text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmFree}
                  disabled={isFreeing}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-amber-600 text-white hover:bg-amber-700 rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isFreeing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      <span>Confirm & Free Volunteer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
