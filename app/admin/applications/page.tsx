"use client"

import { useEffect, useState } from "react"
import AdminHeader from "@/components/admin/AdminHeader"
import ApplicationsTable from "@/components/admin/ApplicationsTable"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { schoolDepartmentData } from "@/lib/constants"

const statusFilters = [
  { value: "all", label: "All Applications" },
  { value: "submitted", label: "Pending Review" },
  { value: "under-review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "duplicate", label: "Duplicate Applications" },
]

export default function ApplicationsPage() {
  const [activeFilter, setActiveFilter] = useState("all")
  const [unitNo, setUnitNo] = useState<string>("all")
  const [enrollment, setEnrollment] = useState<string>("all")
  const [schoolName, setSchoolName] = useState<string>("")
  const [departmentName, setDepartmentName] = useState<string>("")
  const [nameSearch, setNameSearch] = useState<string>("")
  const [stats, setStats] = useState<any | null>(null)
  const [schools, setSchools] = useState<string[]>([])
  const [loadingSchools, setLoadingSchools] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [activeFilter, unitNo, enrollment, schoolName, departmentName, nameSearch])

  useEffect(() => {
    fetchSchools()
  }, [])

  const fetchStats = async () => {
    const params = new URLSearchParams()
    if (unitNo !== 'all') params.set('unitNo', unitNo)
    if (enrollment === 'first-year' || enrollment === 'second-year') params.set('enrollment', enrollment)
    if (schoolName) params.set('schoolName', schoolName)
    if (departmentName) params.set('departmentName', departmentName)
    if (nameSearch) params.set('nameSearch', nameSearch)
    try {
      const res = await fetch(`/api/admin/applications-stats?${params.toString()}`)
      const data = await res.json()
      if (data.success) setStats(data)
    } catch {}
  }

  const fetchSchools = async () => {
    try {
      setLoadingSchools(true)
      const res = await fetch('/api/applications/schools')
      const data = await res.json()
      if (data.success) {
        setSchools(data.schools || [])
      }
    } catch (error) {
      console.error('Error fetching schools:', error)
    } finally {
      setLoadingSchools(false)
    }
  }

  return (
    <ProtectedRoute requiredRole="sub-admin" requiredPermission="applications.view">
      <AdminHeader title="Applications" subtitle="Manage NSS volunteer applications" />

      <div className="p-6 space-y-6">
        {/* Unit-wise Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats && Object.keys(stats.units || {}).sort().map((unit) => {
            const u = stats.units[unit]
            return (
              <div key={unit} className="bg-card rounded-xl border border-border p-5 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-foreground">Unit {unit}</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{u.total} Total</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="text-blue-900 font-semibold">{u.submitted}</div>
                    <div className="text-blue-700">Pending</div>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                    <div className="text-yellow-900 font-semibold">{u.underReview}</div>
                    <div className="text-yellow-700">Under Review</div>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="text-green-900 font-semibold">{u.approved}</div>
                    <div className="text-green-700">Approved</div>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="text-red-900 font-semibold">{u.rejected}</div>
                    <div className="text-red-700">Rejected</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Filter Tabs */}
        <div>
          <div className="border-b border-border">
            <nav className="-mb-px flex space-x-8">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setActiveFilter(filter.value)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeFilter === filter.value
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Unit</label>
              <select value={unitNo} onChange={(e) => setUnitNo(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground">
                <option value="all">All Units</option>
                <option value="1">Unit 1</option>
                <option value="2">Unit 2</option>
                <option value="3">Unit 3</option>
                <option value="4">Unit 4</option>
                <option value="5">Unit 5</option>
                <option value="6">Unit 6</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Year</label>
              <select value={enrollment} onChange={(e) => setEnrollment(e.target.value)} className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground">
                <option value="all">All Years</option>
                <option value="first-year">1st Year</option>
                <option value="second-year">2nd Year</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">School</label>
              <select 
                value={schoolName} 
                onChange={(e) => setSchoolName(e.target.value)} 
                className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground"
                disabled={loadingSchools}
              >
                <option value="">All Schools</option>
                {schools.map((school) => (
                  <option key={school} value={school}>
                    {school}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Department</label>
              {schoolName && schoolDepartmentData.find((s) => s.name === schoolName) ? (
                <select
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground"
                >
                  <option value="">All Departments</option>
                  {schoolDepartmentData
                    .find((s) => s.name === schoolName)
                    ?.departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                </select>
              ) : (
                <input
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="Search Department"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
              <input 
                value={nameSearch} 
                onChange={(e) => setNameSearch(e.target.value)} 
                placeholder="Search by Name" 
                className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground" 
              />
            </div>
          </div>
        </div>

        {/* Applications Table */}
        <ApplicationsTable
          statusFilter={activeFilter}
          unitNo={unitNo}
          enrollment={enrollment}
          schoolName={schoolName}
          departmentName={departmentName}
          nameSearch={nameSearch}
        />
      </div>
    </ProtectedRoute>
  )
}
