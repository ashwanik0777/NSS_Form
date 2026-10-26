"use client"

import { useEffect, useState, useMemo } from "react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import AdminHeader from "@/components/admin/AdminHeader"
import { schoolDepartmentData } from "@/lib/constants"
import { useToast } from "@/hooks/use-toast"
import {
  TrendingUp,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  BarChart3,
  Award,
  Loader2,
  X,
  User,
  UserX,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  FileText,
  Plus,
  Edit,
  Trash2,
  Save,
  Download,
  ChevronLeft,
  ChevronRight,
  Ban,
  AlertTriangle,
  RotateCcw,
} from "lucide-react"

const formatDate = (value?: string | Date) => {
  if (!value) return "N/A"
  try {
    const dateValue = typeof value === "string" ? value : value.toString()
    return new Date(dateValue).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
  } catch {
    return typeof value === "string" ? value : "N/A"
  }
}

const boolToText = (value?: boolean) => {
  if (value === true) return "Yes"
  if (value === false) return "No"
  return "N/A"
}

interface Volunteer {
  _id: string
  name: string
  email: string
  application?: {
    _id?: string
    formNo: string
    institutionName: string
    status: string
    nameEnglish: string
    mobileNo: string
    enrollment: string
    departmentName: string
    courseName: string
    schoolName: string
    unitNo: string
    submittedAt: string
  }
  stats: {
    projects: number
    events: number
    completedEvents: number
    totalHours: number
    attendanceRate: number
  }
}

interface VolunteerDetail {
  _id: string
  name: string
  email: string
  application?: any
  project?: any
  stats: {
    totalEvents: number
    completedEvents: number
    totalHours: number
    attendanceRate: number
  }
  events: Array<{
    _id: string
    eventTitle: string
    projectTitle: string
    status: string
    startTime?: string
    endTime?: string
    hoursWorked: number
    workDescription?: string
  }>
}

interface Task {
  _id: string
  title: string
  description: string
  assignedTo: {
    _id: string
    name: string
    email: string
  }
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

interface Analytics {
  totalVolunteers: number
  totalActiveProjects: number
  totalEvents: number
  totalEventParticipations: number
  avgAttendanceRate: number
}

export default function VolunteersPage() {
  const { toast } = useToast()
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerDetail | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [tasks, setTasks] = useState<Task[]>([])
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    dueDate: "",
  })
  const [submittingTask, setSubmittingTask] = useState(false)
  const [activeTab, setActiveTab] = useState<"profile" | "tasks" | "events">("profile")
  
  // Filters
  const [unitNo, setUnitNo] = useState<string>("all")
  const [enrollment, setEnrollment] = useState<string>("all")
  const [schoolName, setSchoolName] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("hours-desc")
  const [nameSearch, setNameSearch] = useState<string>("")
  const [stats, setStats] = useState<any | null>(null)
  const [schools, setSchools] = useState<string[]>([])
  const [loadingSchools, setLoadingSchools] = useState(false)
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportUnit, setExportUnit] = useState<string>("all")
  const [exportFormat, setExportFormat] = useState<"excel" | "pdf">("excel")
  const [exportFields, setExportFields] = useState<string[]>([])

  // All exportable fields grouped by category
  const EXPORT_FIELD_GROUPS = useMemo(() => [
    {
      label: "Basic Info",
      fields: [
        { key: "name", label: "Name" },
        { key: "fatherName", label: "Father Name" },
        { key: "motherName", label: "Mother Name" },
        { key: "email", label: "Email" },
        { key: "mobileNo", label: "Mobile No" },
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
      label: "Education",
      fields: [
        { key: "schoolName", label: "School" },
        { key: "departmentName", label: "Department" },
        { key: "courseName", label: "Course" },
        { key: "year", label: "Year (1st/2nd)" },
        { key: "rollNumber", label: "Form/Roll Number" },
        { key: "highSchoolRollNo", label: "High School Roll No" },
        { key: "classSemester", label: "Class/Semester" },
      ],
    },
    {
      label: "NSS Details",
      fields: [
        { key: "unitNo", label: "Unit No" },
        { key: "programOfficerName", label: "Program Officer" },
        { key: "nssEnrollmentYear", label: "NSS Enrollment Year" },
        { key: "myBharatRegistered", label: "My Bharat Registered" },
        { key: "myBharatPortalId", label: "My Bharat Portal ID" },
        { key: "attendedSpecialCamp", label: "Attended Special Camp" },
        { key: "attendedELP", label: "Attended ELP" },
        { key: "specialNSSAchievements", label: "Special NSS Achievements" },
        { key: "otherAchievements", label: "Other Achievements" },
      ],
    },
    {
      label: "Stats & Activity",
      fields: [
        { key: "totalHours", label: "Total NSS Hours" },
        { key: "eventHours", label: "Event Hours" },
        { key: "meetingHours", label: "Meeting Hours" },
        { key: "totalEvents", label: "Total Events" },
        { key: "completedEvents", label: "Completed Events" },
        { key: "attendanceRate", label: "Attendance %" },
        { key: "activeProjects", label: "Active Projects" },
      ],
    },
  ], [])

  const ALL_EXPORT_KEYS = useMemo(() =>
    EXPORT_FIELD_GROUPS.flatMap(g => g.fields.map(f => f.key)),
    [EXPORT_FIELD_GROUPS]
  )

  // Initialize export fields with a sensible default set when modal opens
  const openExportModal = () => {
    if (exportFields.length === 0) {
      setExportFields([
        "name", "fatherName", "email", "mobileNo", "gender", "category",
        "schoolName", "departmentName", "courseName", "year", "rollNumber",
        "unitNo", "totalHours", "totalEvents", "attendanceRate",
      ])
    }
    setShowExportModal(true)
  }

  const toggleExportField = (key: string) => {
    setExportFields(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    )
  }

  const toggleGroupFields = (groupFields: { key: string }[], select: boolean) => {
    const keys = groupFields.map(f => f.key)
    if (select) {
      setExportFields(prev => [...new Set([...prev, ...keys])])
    } else {
      setExportFields(prev => prev.filter(k => !keys.includes(k)))
    }
  }
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalVolunteers, setTotalVolunteers] = useState(0)
  const itemsPerPage = 20

  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<{id: string, name: string} | null>(null)
  const [removeReason, setRemoveReason] = useState("")
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when filters change
  }, [unitNo, enrollment, schoolName, sortBy, nameSearch])

  useEffect(() => {
    fetchData()
    fetchStats()
  }, [unitNo, enrollment, schoolName, sortBy, nameSearch, currentPage])

  useEffect(() => {
    fetchSchools()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (unitNo !== 'all') params.set('unitNo', unitNo)
      if (enrollment === 'first-year' || enrollment === 'second-year') params.set('enrollment', enrollment)
      if (schoolName) params.set('schoolName', schoolName)
      params.set('sortBy', sortBy)
      if (nameSearch) params.set('nameSearch', nameSearch)
      params.set('page', currentPage.toString())
      params.set('limit', itemsPerPage.toString())

      const res = await fetch(`/api/admin/volunteer-management?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setVolunteers(data.volunteers || [])
        setAnalytics(data.analytics || null)
        setTotalPages(data.totalPages || 1)
        setTotalVolunteers(data.totalVolunteers || 0)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    const params = new URLSearchParams()
    params.set('status', 'approved')
    if (unitNo !== 'all') params.set('unitNo', unitNo)
    if (enrollment === 'first-year' || enrollment === 'second-year') params.set('enrollment', enrollment)
    if (schoolName) params.set('schoolName', schoolName)
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

  const handleRemoveVolunteer = async () => {
    if (!removeTarget || !removeReason.trim()) return
    
    setRemoving(true)
    try {
      const res = await fetch('/api/admin/volunteer-management', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          volunteerId: removeTarget.id,
          reason: removeReason.trim(),
        }),
      })
      
      const data = await res.json()
      if (data.success) {
        toast({
          title: "Volunteer Removed",
          description: `${removeTarget.name} has been removed successfully.`,
          variant: "default",
        })
        setShowRemoveModal(false)
        setRemoveTarget(null)
        setRemoveReason("")
        // Close detail modal if open
        setShowDetailModal(false)
        setSelectedVolunteer(null)
        // Refresh data
        fetchData()
        fetchStats()
      } else {
        toast({
          title: "Error",
          description: data.message || 'Failed to remove volunteer',
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error removing volunteer:', error)
      toast({
        title: "Error",
        description: 'Failed to remove volunteer',
        variant: "destructive",
      })
    } finally {
      setRemoving(false)
    }
  }

  const handleExport = async () => {
    if (exportFields.length === 0) {
      toast({ title: "No fields selected", description: "Please select at least one field to export.", variant: "destructive" })
      return
    }
    try {
      setExporting(exportFormat)
      const params = new URLSearchParams()
      params.set("format", exportFormat)
      if (exportUnit !== "all") params.set("unitNo", exportUnit)
      params.set("fields", exportFields.join(","))

      const res = await fetch(`/api/admin/volunteer-management?${params.toString()}`)
      if (!res.ok) {
        alert("Failed to export data")
        return
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      const fileNameBase =
        exportUnit !== "all" ? `volunteers_unit_${exportUnit}` : "volunteers_all_units"
      a.download = `${fileNameBase}.${exportFormat === "excel" ? "xls" : "pdf"}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setShowExportModal(false)
    } catch (error) {
      console.error("Export error:", error)
      alert("Failed to export data")
    } finally {
      setExporting(null)
    }
  }

  const fetchVolunteerDetail = async (volunteerId: string) => {
    try {
      const res = await fetch(`/api/admin/volunteer-management?volunteerId=${volunteerId}`)
      const data = await res.json()
      if (data.success) {
        setSelectedVolunteer(data.volunteer)
        setShowDetailModal(true)
        setActiveTab("profile")
        fetchTasks(volunteerId)
      }
    } catch (error) {
      console.error("Error fetching volunteer detail:", error)
    }
  }

  const fetchTasks = async (volunteerId: string) => {
    try {
      const res = await fetch(`/api/admin/tasks?volunteerId=${volunteerId}`)
      const data = await res.json()
      if (data.success) {
        setTasks(data.tasks || [])
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
    }
  }

  const handleAssignTask = async () => {
    if (!selectedVolunteer || !taskForm.title || !taskForm.description) {
      return
    }

    setSubmittingTask(true)
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...taskForm,
          assignedTo: selectedVolunteer._id,
          unitNo: selectedVolunteer.application?.unitNo,
        }),
      })

      const data = await res.json()
      if (data.success) {
        setTaskForm({ title: "", description: "", priority: "medium", dueDate: "" })
        setShowTaskForm(false)
        fetchTasks(selectedVolunteer._id)
      } else {
        alert(data.message || "Failed to assign task")
      }
    } catch (error) {
      console.error("Error assigning task:", error)
      alert("Failed to assign task")
    } finally {
      setSubmittingTask(false)
    }
  }

  const handleUpdateTaskStatus = async (taskId: string, status: string) => {
    try {
      const res = await fetch("/api/admin/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status }),
      })

      const data = await res.json()
      if (data.success) {
        fetchTasks(selectedVolunteer?._id || "")
      }
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return

    try {
      const res = await fetch(`/api/admin/tasks?id=${taskId}`, {
        method: "DELETE",
      })

      const data = await res.json()
      if (data.success) {
        fetchTasks(selectedVolunteer?._id || "")
      }
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  if (loading && volunteers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="sub-admin" requiredPermission="volunteers.view">
      <AdminHeader title="Volunteers" subtitle="Manage registered NSS volunteers" />
      
      <div className="p-6 space-y-6">
        {/* Export Controls */}
        <div className="flex justify-end gap-3">
          <button
            onClick={openExportModal}
            disabled={exporting !== null}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Unit-wise Stat Cards */}
        {stats && Object.keys(stats.units || {}).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(stats.units || {}).sort().map((unit) => {
              const u = stats.units[unit]
              return (
                <div key={unit} className="bg-card rounded-xl border border-border p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground">Unit {unit}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{u.approved} Volunteers</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="text-green-900 font-semibold">{u.approved}</div>
                      <div className="text-green-700">Approved</div>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="text-blue-900 font-semibold">{u.total}</div>
                      <div className="text-blue-700">Total</div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Volunteers</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{analytics.totalVolunteers}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Project Volunteers</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{analytics.totalActiveProjects}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{analytics.totalEvents}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Attendance</p>
                  <p className="text-3xl font-bold text-foreground mt-2">{analytics.avgAttendanceRate}%</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>
          </div>
        )}

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
              <label className="block text-xs font-medium text-muted-foreground mb-1">Sort By</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground"
              >
                <option value="hours-desc">Most Hours (High to Low)</option>
                <option value="hours-asc">Least Hours (Low to High)</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
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

        {/* Volunteers Table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Volunteer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">School & Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Unit</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Projects</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Events</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Hours</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Attendance</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 className="animate-spin w-8 h-8 text-primary" />
                      </div>
                    </td>
                  </tr>
                ) : volunteers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-medium text-foreground">No volunteers found</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        No volunteers match the selected filters.
                      </p>
                    </td>
                  </tr>
                ) : (
                  volunteers.map((volunteer) => (
                    <tr key={volunteer._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-foreground">{volunteer.application?.nameEnglish || volunteer.name}</p>
                          <p className="text-sm text-muted-foreground">{volunteer.email}</p>
                          {volunteer.application?.mobileNo && (
                            <p className="text-xs text-muted-foreground">{volunteer.application.mobileNo}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="text-foreground font-medium">{volunteer.application?.schoolName || "—"}</p>
                          <p className="text-xs text-muted-foreground">{volunteer.application?.departmentName || "—"}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                          {volunteer.application?.unitNo || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {volunteer.stats.projects}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          {volunteer.stats.events}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm text-foreground">
                          <Clock className="w-4 h-4 mr-1" />
                          {volunteer.stats.totalHours}h
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              volunteer.stats.attendanceRate >= 80
                                ? "bg-green-100 text-green-800"
                                : volunteer.stats.attendanceRate >= 50
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {volunteer.stats.attendanceRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => fetchVolunteerDetail(volunteer._id)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {volunteer.application?._id && (
                            <a
                              href={`/api/generate-pdf?id=${volunteer.application._id}`}
                              target="_blank"
                              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                              title="Download Application PDF"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setRemoveTarget({ id: volunteer._id, name: volunteer.application?.nameEnglish || volunteer.name })
                              setRemoveReason("")
                              setShowRemoveModal(true)
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                            title="Remove Volunteer"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-card rounded-xl border border-border px-6 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalVolunteers)} of {totalVolunteers} volunteers
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
                className="flex items-center gap-1 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={loading}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        currentPage === pageNum
                          ? "bg-primary text-primary-foreground"
                          : "border border-border hover:bg-muted"
                      } disabled:opacity-50`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || loading}
                className="flex items-center gap-1 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Volunteer Detail Modal */}
        {showDetailModal && selectedVolunteer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl border border-border max-w-6xl w-full max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{selectedVolunteer.name}</h2>
                  <p className="text-muted-foreground flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4" />
                    {selectedVolunteer.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setRemoveTarget({ id: selectedVolunteer._id, name: selectedVolunteer.name })
                      setRemoveReason("")
                      setShowRemoveModal(true)
                    }}
                    className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/50 dark:text-red-400 dark:hover:bg-red-950/80 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
                    title="Remove Volunteer"
                  >
                    <Ban className="w-4 h-4" />
                    Remove
                  </button>
                  <button
                    onClick={() => {
                      setShowDetailModal(false)
                      setSelectedVolunteer(null)
                      setTasks([])
                      setShowTaskForm(false)
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border px-6">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-4 py-3 font-medium transition-colors ${
                    activeTab === "profile"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Complete Profile
                </button>
                <button
                  onClick={() => setActiveTab("tasks")}
                  className={`px-4 py-3 font-medium transition-colors ${
                    activeTab === "tasks"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Tasks ({tasks.length})
                </button>
                <button
                  onClick={() => setActiveTab("events")}
                  className={`px-4 py-3 font-medium transition-colors ${
                    activeTab === "events"
                      ? "text-primary border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Events ({selectedVolunteer.events.length})
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Total Events</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{selectedVolunteer.stats.totalEvents}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Completed</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{selectedVolunteer.stats.completedEvents}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Total Hours</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{selectedVolunteer.stats.totalHours}h</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Attendance</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{selectedVolunteer.stats.attendanceRate}%</p>
                      </div>
                    </div>

                    {/* Complete Profile Information */}
                    {selectedVolunteer.application && (
                      <div className="bg-muted/50 rounded-lg p-6 space-y-6">
                        <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
                          <User className="w-5 h-5" />
                          Complete Profile Information
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Form Number</p>
                            <p className="text-foreground font-medium">{selectedVolunteer.application.formNo || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Unit Number</p>
                            <p className="text-foreground font-medium">{selectedVolunteer.application.unitNo || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              Email
                            </p>
                            <p className="text-foreground font-medium">{selectedVolunteer.email}</p>
                          </div>
                          {selectedVolunteer.application.mobileNo && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                Mobile Number
                              </p>
                              <p className="text-foreground font-medium">{selectedVolunteer.application.mobileNo}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Name (English)</p>
                            <p className="text-foreground font-medium">{selectedVolunteer.application.nameEnglish || selectedVolunteer.name}</p>
                          </div>
                          {selectedVolunteer.application.nameHindi && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Name (Hindi)</p>
                              <p className="text-foreground font-medium">{selectedVolunteer.application.nameHindi}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Institution
                            </p>
                            <p className="text-foreground font-medium">{selectedVolunteer.application.institutionName || "N/A"}</p>
                          </div>
                          {selectedVolunteer.application.schoolName && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">School Name</p>
                              <p className="text-foreground font-medium">{selectedVolunteer.application.schoolName}</p>
                            </div>
                          )}
                          {selectedVolunteer.application.departmentName && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                <GraduationCap className="w-3 h-3" />
                                Department
                              </p>
                              <p className="text-foreground font-medium">{selectedVolunteer.application.departmentName}</p>
                            </div>
                          )}
                          {selectedVolunteer.application.courseName && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Course</p>
                              <p className="text-foreground font-medium">{selectedVolunteer.application.courseName}</p>
                            </div>
                          )}
                          {selectedVolunteer.application.enrollment && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Enrollment</p>
                              <p className="text-foreground font-medium">{selectedVolunteer.application.enrollment}</p>
                            </div>
                          )}
                          {selectedVolunteer.application.institutionalIdCard && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Institution ID Card</p>
                              <p className="text-foreground font-medium">{selectedVolunteer.application.institutionalIdCard}</p>
                            </div>
                          )}
                          {selectedVolunteer.application.socialFacebook && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Facebook</p>
                              <a href={selectedVolunteer.application.socialFacebook} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                View Profile
                              </a>
                            </div>
                          )}
                          {selectedVolunteer.application.socialInstagram && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Instagram</p>
                              <a href={selectedVolunteer.application.socialInstagram} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                View Profile
                              </a>
                            </div>
                          )}
                          {selectedVolunteer.application.socialTwitter && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">Twitter/X</p>
                              <a href={selectedVolunteer.application.socialTwitter} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                View Profile
                              </a>
                            </div>
                          )}
                          {selectedVolunteer.application.socialLinkedin && (
                            <div>
                              <p className="text-sm text-muted-foreground mb-1">LinkedIn</p>
                              <a href={selectedVolunteer.application.socialLinkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                View Profile
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Date of Birth</p>
                            <p className="text-foreground font-medium">{formatDate(selectedVolunteer.application.dateOfBirth)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Gender</p>
                            <p className="text-foreground font-medium text-capitalize">{selectedVolunteer.application.gender || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Category</p>
                            <p className="text-foreground font-medium text-uppercase">{selectedVolunteer.application.category || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Blood Group</p>
                            <p className="text-foreground font-medium">{selectedVolunteer.application.bloodGroup || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">NSS Enrollment Year</p>
                            <p className="text-foreground font-medium">{selectedVolunteer.application.nssEnrollmentYear || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Program Officer</p>
                            <p className="text-foreground font-medium">{selectedVolunteer.application.programOfficerName || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">High School Roll No.</p>
                            <p className="text-foreground font-medium">{selectedVolunteer.application.highSchoolRollNo || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Current Semester/Class</p>
                            <p className="text-foreground font-medium">{selectedVolunteer.application.classSemester || "N/A"}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Address Type</p>
                            <p className="text-foreground font-medium capitalize">{selectedVolunteer.application.addressType || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">My Bharat Registered</p>
                            <p className="text-foreground font-medium">{boolToText(selectedVolunteer.application.myBharatPortalRegistered)}</p>
                          </div>
                          {selectedVolunteer.application.hostelAddress && (
                            <div className="md:col-span-2">
                              <p className="text-sm text-muted-foreground mb-1">Hostel Address</p>
                              <p className="text-foreground font-medium">{selectedVolunteer.application.hostelAddress}</p>
                            </div>
                          )}
                          {selectedVolunteer.application.homeAddress && (
                            <div className="md:col-span-2">
                              <p className="text-sm text-muted-foreground mb-1">Home Address</p>
                              <p className="text-foreground font-medium">{selectedVolunteer.application.homeAddress}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Attended Special Camp</p>
                            <p className="text-foreground font-medium">{boolToText(selectedVolunteer.application.attendedSpecialCamp)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Attended ELP</p>
                            <p className="text-foreground font-medium">{boolToText(selectedVolunteer.application.attendedELP)}</p>
                          </div>
                        </div>

                        {selectedVolunteer.application.specialCampDetails && (
                          <div className="border border-border rounded-lg p-4 bg-white/30">
                            <p className="text-sm font-semibold text-foreground mb-3">Special Camp Details</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground mb-1">Village</p>
                                <p className="font-medium text-foreground">
                                  {selectedVolunteer.application.specialCampDetails.villageName || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Venue</p>
                                <p className="font-medium text-foreground">
                                  {selectedVolunteer.application.specialCampDetails.venue || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground mb-1">Date</p>
                                <p className="font-medium text-foreground">
                                  {formatDate(selectedVolunteer.application.specialCampDetails.date)}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Project Info */}
                    {selectedVolunteer.project && (
                      <div className="bg-muted/50 rounded-lg p-4">
                        <h3 className="font-semibold text-foreground mb-2">Current Project</h3>
                        <p className="text-foreground font-medium">{selectedVolunteer.project.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{selectedVolunteer.project.description}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tasks Tab */}
                {activeTab === "tasks" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-foreground">Assigned Tasks</h3>
                      <button
                        onClick={() => setShowTaskForm(!showTaskForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Assign New Task
                      </button>
                    </div>

                    {/* Task Assignment Form */}
                    {showTaskForm && (
                      <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                        <h4 className="font-semibold text-foreground">Assign New Task</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Task Title *</label>
                            <input
                              type="text"
                              value={taskForm.title}
                              onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                              className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground"
                              placeholder="Enter task title"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Description *</label>
                            <textarea
                              value={taskForm.description}
                              onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                              className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground"
                              rows={3}
                              placeholder="Enter task description"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">Priority</label>
                              <select
                                value={taskForm.priority}
                                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">Due Date</label>
                              <input
                                type="datetime-local"
                                value={taskForm.dueDate}
                                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleAssignTask}
                              disabled={submittingTask || !taskForm.title || !taskForm.description}
                              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                              {submittingTask ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Assigning...
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4" />
                                  Assign Task
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setShowTaskForm(false)
                                setTaskForm({ title: "", description: "", priority: "medium", dueDate: "" })
                              }}
                              className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tasks List */}
                    <div className="space-y-3">
                      {tasks.length > 0 ? (
                        tasks.map((task) => (
                          <div key={task._id} className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-foreground">{task.title}</h4>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      task.priority === "urgent"
                                        ? "bg-red-100 text-red-800"
                                        : task.priority === "high"
                                          ? "bg-orange-100 text-orange-800"
                                          : task.priority === "medium"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {task.priority}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                      task.status === "completed"
                                        ? "bg-green-100 text-green-800"
                                        : task.status === "in-progress"
                                          ? "bg-blue-100 text-blue-800"
                                          : task.status === "cancelled"
                                            ? "bg-gray-100 text-gray-800"
                                            : "bg-yellow-100 text-yellow-800"
                                    }`}
                                  >
                                    {task.status}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                                {task.dueDate && (
                                  <p className="text-xs text-muted-foreground">
                                    Due: {new Date(task.dueDate).toLocaleString()}
                                  </p>
                                )}
                                {task.completedAt && (
                                  <p className="text-xs text-green-600 mt-1">
                                    Completed: {new Date(task.completedAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                {task.status !== "completed" && task.status !== "cancelled" && (
                                  <button
                                    onClick={() => handleUpdateTaskStatus(task._id, "completed")}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Mark as completed"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteTask(task._id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete task"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-8">No tasks assigned yet</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Events Tab */}
                {activeTab === "events" && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-foreground">Event History</h3>
                    <div className="space-y-3">
                      {selectedVolunteer.events.length > 0 ? (
                        selectedVolunteer.events.map((event) => (
                          <div key={event._id} className="bg-muted/50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-foreground">{event.eventTitle}</p>
                                <p className="text-sm text-muted-foreground">{event.projectTitle}</p>
                              </div>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  event.status === "completed"
                                    ? "bg-green-100 text-green-800"
                                    : event.status === "started"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {event.status}
                              </span>
                            </div>
                            {event.workDescription && (
                              <p className="text-sm text-muted-foreground mb-2">{event.workDescription}</p>
                            )}
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              {event.startTime && (
                                <span>Start: {new Date(event.startTime).toLocaleString()}</span>
                              )}
                              {event.endTime && (
                                <span>End: {new Date(event.endTime).toLocaleString()}</span>
                              )}
                              {event.hoursWorked > 0 && (
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {event.hoursWorked}h
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-8">No events yet</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Remove Volunteer Confirmation Modal */}
        {showRemoveModal && removeTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-card rounded-xl border border-border max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Remove Volunteer</h3>
                  <p className="text-sm text-muted-foreground">This action cannot be easily undone</p>
                </div>
              </div>
              
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-800 dark:text-red-300">
                  <strong>{removeTarget.name}</strong> will be deactivated:
                </p>
                <ul className="text-xs text-red-700 dark:text-red-400 mt-2 space-y-1 list-disc list-inside">
                  <li>Cannot login to their account</li>
                  <li>Unit seat will become available</li>
                  <li>Active project assignments will be deactivated</li>
                  <li>Cannot submit a new registration form</li>
                  <li>Will move to Past Volunteers section</li>
                </ul>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-foreground mb-1">Reason for removal <span className="text-red-500">*</span></label>
                <textarea
                  value={removeReason}
                  onChange={(e) => setRemoveReason(e.target.value)}
                  placeholder="e.g., Not attending events, left the institution, disciplinary action..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground text-sm min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRemoveModal(false)
                    setRemoveTarget(null)
                    setRemoveReason("")
                  }}
                  className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  disabled={removing}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemoveVolunteer}
                  disabled={!removeReason.trim() || removing}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {removing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Removing...</>
                  ) : (
                    <><Ban className="w-4 h-4" /> Remove Volunteer</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl border border-border max-w-2xl w-full p-6 max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-foreground">Export Volunteers</h2>
                <button
                  onClick={() => {
                    setShowExportModal(false)
                    setExportUnit("all")
                    setExportFormat("excel")
                  }}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 space-y-5 pr-1">
                {/* Unit Selection */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Select Unit
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <label className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors text-sm ${
                      exportUnit === "all" ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:bg-muted/50"
                    }`}>
                      <input
                        type="radio"
                        name="exportUnit"
                        value="all"
                        checked={exportUnit === "all"}
                        onChange={(e) => setExportUnit(e.target.value)}
                        className="sr-only"
                      />
                      All Units
                    </label>
                    {[1, 2, 3, 4, 5, 6].map((unit) => (
                      <label
                        key={unit}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors text-sm ${
                          exportUnit === unit.toString() ? "border-primary bg-primary/10 text-primary font-medium" : "border-border hover:bg-muted/50"
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
                        Unit {unit}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Field Selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-foreground">
                      Select Fields to Export
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setExportFields([...ALL_EXPORT_KEYS])}
                        className="text-xs text-primary hover:underline"
                      >
                        Select All
                      </button>
                      <span className="text-xs text-muted-foreground">|</span>
                      <button
                        type="button"
                        onClick={() => setExportFields([])}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{exportFields.length} of {ALL_EXPORT_KEYS.length} fields selected</p>
                  <div className="space-y-4">
                    {EXPORT_FIELD_GROUPS.map((group) => {
                      const groupKeys = group.fields.map(f => f.key)
                      const allSelected = groupKeys.every(k => exportFields.includes(k))
                      const someSelected = groupKeys.some(k => exportFields.includes(k))
                      return (
                        <div key={group.label} className="border border-border rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between px-3 py-2 bg-muted/50">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={allSelected}
                                ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
                                onChange={() => toggleGroupFields(group.fields, !allSelected)}
                                className="w-3.5 h-3.5 rounded text-primary"
                              />
                              <span className="text-xs font-semibold text-foreground uppercase tracking-wide">{group.label}</span>
                            </label>
                            <span className="text-xs text-muted-foreground">
                              {groupKeys.filter(k => exportFields.includes(k)).length}/{groupKeys.length}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 p-3">
                            {group.fields.map((field) => (
                              <label
                                key={field.key}
                                className="flex items-center gap-2 py-1 cursor-pointer hover:bg-muted/30 rounded px-1 transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={exportFields.includes(field.key)}
                                  onChange={() => toggleExportField(field.key)}
                                  className="w-3.5 h-3.5 rounded text-primary"
                                />
                                <span className="text-sm text-foreground">{field.label}</span>
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
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Select Format
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      exportFormat === "excel" ? "border-green-500 bg-green-50 dark:bg-green-950/30" : "border-border hover:bg-muted/50"
                    }`}>
                      <input
                        type="radio"
                        name="exportFormat"
                        value="excel"
                        checked={exportFormat === "excel"}
                        onChange={(e) => setExportFormat(e.target.value as "excel" | "pdf")}
                        className="sr-only"
                      />
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="text-foreground font-medium">Excel</span>
                    </label>
                    <label className={`flex items-center justify-center gap-2 p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                      exportFormat === "pdf" ? "border-red-500 bg-red-50 dark:bg-red-950/30" : "border-border hover:bg-muted/50"
                    }`}>
                      <input
                        type="radio"
                        name="exportFormat"
                        value="pdf"
                        checked={exportFormat === "pdf"}
                        onChange={(e) => setExportFormat(e.target.value as "excel" | "pdf")}
                        className="sr-only"
                      />
                      <FileText className="w-5 h-5 text-red-600" />
                      <span className="text-foreground font-medium">PDF</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons - sticky at bottom */}
              <div className="flex gap-3 pt-4 mt-4 border-t border-border">
                <button
                  onClick={handleExport}
                  disabled={exporting !== null || exportFields.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors font-medium"
                >
                  {exporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Export {exportFields.length} Fields
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowExportModal(false)
                    setExportUnit("all")
                    setExportFormat("excel")
                  }}
                  className="px-4 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}
