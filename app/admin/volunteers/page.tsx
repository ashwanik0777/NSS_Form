"use client"

import { useEffect, useState, useMemo, useRef } from "react"
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
  ChevronDown,
  SlidersHorizontal,
  Ban,
  AlertTriangle,
  RotateCcw,
  Search,
  CheckCircle2,
  CalendarCheck,
  Image as ImageIcon,
  ExternalLink,
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
    nameHindi?: string
    fatherName?: string
    emailId?: string
    mobileNo: string
    enrollment: string
    departmentName: string
    courseName: string
    schoolName: string
    unitNo: string
    submittedAt: string
    reviewedAt?: string | Date
    photo?: string
    institutionalIdCard?: string
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
  photo?: string
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
  
  // Filters & Search
  const [unitNo, setUnitNo] = useState<string>("all")
  const [enrollment, setEnrollment] = useState<string>("all")
  const [schoolName, setSchoolName] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("hours-desc")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  const activeFiltersCount = useMemo(() => {
    return (
      (unitNo !== "all" ? 1 : 0) +
      (enrollment !== "all" ? 1 : 0) +
      (schoolName ? 1 : 0) +
      (sortBy !== "hours-desc" ? 1 : 0)
    )
  }, [unitNo, enrollment, schoolName, sortBy])
  const [isTableLoading, setIsTableLoading] = useState(false)
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
  const itemsPerPage = 20

  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<{id: string, name: string} | null>(null)
  const [removeReason, setRemoveReason] = useState("")
  const [removing, setRemoving] = useState(false)

  // 1. Instant keystroke handler (0ms latency, no debounce)
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleClearSearch = () => {
    setSearchQuery("")
    setCurrentPage(1)
  }

  // 2. Instant in-memory search across ALL volunteer fields (name, email, phone, roll, unit, dept, school)
  const filteredVolunteers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) {
      return volunteers
    }

    const digitsOnly = query.replace(/\D/g, "")

    return volunteers.filter((volunteer) => {
      const name = (volunteer.application?.nameEnglish || volunteer.name || "").toLowerCase()
      const hindiName = (volunteer.application?.nameHindi || "").toLowerCase()
      const email = (volunteer.email || volunteer.application?.emailId || "").toLowerCase()
      const mobile = (volunteer.application?.mobileNo || "").toLowerCase()
      const mobileDigits = mobile.replace(/\D/g, "")
      const rollNo = (volunteer.application?.institutionalIdCard || volunteer.application?.formNo || "").toLowerCase()
      const unit = (volunteer.application?.unitNo || "").toLowerCase()
      const school = (volunteer.application?.schoolName || "").toLowerCase()
      const dept = (volunteer.application?.departmentName || "").toLowerCase()

      return (
        name.includes(query) ||
        hindiName.includes(query) ||
        email.includes(query) ||
        mobile.includes(query) ||
        (digitsOnly.length >= 3 && mobileDigits.includes(digitsOnly)) ||
        rollNo.includes(query) ||
        unit.includes(query) ||
        school.includes(query) ||
        dept.includes(query)
      )
    })
  }, [volunteers, searchQuery])

  // 3. Instant in-memory sorting
  const sortedVolunteers = useMemo(() => {
    const list = [...filteredVolunteers]
    if (sortBy === "hours-desc") {
      return list.sort((a, b) => {
        const diff = (b.stats?.totalHours || 0) - (a.stats?.totalHours || 0)
        if (diff !== 0) return diff
        return (b.stats?.attendanceRate || 0) - (a.stats?.attendanceRate || 0)
      })
    }
    if (sortBy === "hours-asc") {
      return list.sort((a, b) => {
        const diff = (a.stats?.totalHours || 0) - (b.stats?.totalHours || 0)
        if (diff !== 0) return diff
        return (a.stats?.attendanceRate || 0) - (b.stats?.attendanceRate || 0)
      })
    }
    if (sortBy === "name-asc") {
      return list.sort((a, b) => {
        const nameA = (a.application?.nameEnglish || a.name || "").toLowerCase()
        const nameB = (b.application?.nameEnglish || b.name || "").toLowerCase()
        return nameA.localeCompare(nameB)
      })
    }
    if (sortBy === "name-desc") {
      return list.sort((a, b) => {
        const nameA = (a.application?.nameEnglish || a.name || "").toLowerCase()
        const nameB = (b.application?.nameEnglish || b.name || "").toLowerCase()
        return nameB.localeCompare(nameA)
      })
    }
    return list
  }, [filteredVolunteers, sortBy])

  // 4. Instant in-memory pagination
  const totalVolunteersCount = sortedVolunteers.length
  const totalVolunteers = totalVolunteersCount
  const totalPages = Math.max(1, Math.ceil(totalVolunteersCount / itemsPerPage))

  const displayVolunteers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return sortedVolunteers.slice(startIndex, startIndex + itemsPerPage)
  }, [sortedVolunteers, currentPage, itemsPerPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [unitNo, enrollment, schoolName, sortBy])

  useEffect(() => {
    fetchData()
    fetchStats()
  }, [unitNo, enrollment, schoolName])

  useEffect(() => {
    fetchSchools()
  }, [])

  const fetchData = async () => {
    try {
      if (volunteers.length === 0) {
        setLoading(true)
      } else {
        setIsTableLoading(true)
      }

      const params = new URLSearchParams()
      if (unitNo !== 'all') params.set('unitNo', unitNo)
      if (enrollment === 'first-year' || enrollment === 'second-year') params.set('enrollment', enrollment)
      if (schoolName) params.set('schoolName', schoolName)
      params.set('page', '1')
      params.set('limit', '2000')

      const res = await fetch(`/api/admin/volunteer-management?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setVolunteers(data.volunteers || [])
        setAnalytics(data.analytics || null)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
      setIsTableLoading(false)
    }
  }

  const fetchStats = async () => {
    const params = new URLSearchParams()
    params.set('status', 'approved')
    if (unitNo !== 'all') params.set('unitNo', unitNo)
    if (enrollment === 'first-year' || enrollment === 'second-year') params.set('enrollment', enrollment)
    if (schoolName) params.set('schoolName', schoolName)
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
      
      <div className="p-3 sm:p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Top Header Row with Export Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="md:hidden">
            <h2 className="text-base font-bold text-foreground">Volunteers List</h2>
            <p className="text-xs text-muted-foreground">
              {totalVolunteers > 0 ? (searchQuery ? `${totalVolunteers} found` : `${totalVolunteers} registered`) : "0 volunteers"}
            </p>
          </div>
          <div className="flex justify-end gap-3 ml-auto">
            <button
              onClick={openExportModal}
              disabled={exporting !== null}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-primary text-primary-foreground rounded-lg text-xs sm:text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Analytics Cards (2x2 on mobile, 4-column on desktop) */}
        {analytics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
            <div className="bg-card rounded-xl border border-border p-3 sm:p-4 md:p-6 shadow-xs">
              <div className="flex items-center justify-between gap-1.5">
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground truncate font-medium">Total Volunteers</p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground mt-0.5 sm:mt-1 md:mt-2 truncate">{analytics.totalVolunteers}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-100 dark:bg-blue-950/50 rounded-lg flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-3 sm:p-4 md:p-6 shadow-xs">
              <div className="flex items-center justify-between gap-1.5">
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground truncate font-medium">Project Vol.</p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground mt-0.5 sm:mt-1 md:mt-2 truncate">{analytics.totalActiveProjects}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-100 dark:bg-green-950/50 rounded-lg flex items-center justify-center shrink-0">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-3 sm:p-4 md:p-6 shadow-xs">
              <div className="flex items-center justify-between gap-1.5">
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground truncate font-medium">Total Events</p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground mt-0.5 sm:mt-1 md:mt-2 truncate">{analytics.totalEvents}</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-purple-100 dark:bg-purple-950/50 rounded-lg flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-3 sm:p-4 md:p-6 shadow-xs">
              <div className="flex items-center justify-between gap-1.5">
                <div className="min-w-0">
                  <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground truncate font-medium">Avg. Attendance</p>
                  <p className="text-lg sm:text-2xl md:text-3xl font-bold text-foreground mt-0.5 sm:mt-1 md:mt-2 truncate">{analytics.avgAttendanceRate}%</p>
                </div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-yellow-100 dark:bg-yellow-950/50 rounded-lg flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Unit-wise Stat Cards (Horizontal Swipe Strip on Mobile, Grid on Desktop) */}
        {stats && Object.keys(stats.units || {}).length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unit Distribution</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                  {Object.keys(stats.units || {}).length} Units
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground md:hidden flex items-center gap-1">
                Swipe for more →
              </span>
            </div>

            <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4 overflow-x-auto pb-2 pt-0.5 scrollbar-none snap-x md:overflow-visible">
              {Object.keys(stats.units || {}).sort().map((unit) => {
                const u = stats.units[unit]
                return (
                  <div key={unit} className="bg-card rounded-xl border border-border p-3 sm:p-4 shadow-xs shrink-0 w-[150px] sm:w-[170px] md:w-auto snap-start hover:border-primary/40 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs sm:text-sm font-semibold text-foreground">Unit {unit}</h3>
                      <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-medium">
                        {u.approved} Vol.
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <div className="p-1.5 sm:p-2 rounded-lg bg-green-50/80 dark:bg-green-950/20 border border-green-200/80 dark:border-green-900/40 text-center">
                        <div className="text-green-900 dark:text-green-300 font-bold text-xs sm:text-sm">{u.approved}</div>
                        <div className="text-[10px] text-green-700 dark:text-green-400">Approved</div>
                      </div>
                      <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 text-center">
                        <div className="text-blue-900 dark:text-blue-300 font-bold text-xs sm:text-sm">{u.total}</div>
                        <div className="text-[10px] text-blue-700 dark:text-blue-400">Total</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Advanced Filters */}
        <div className="bg-card rounded-xl border border-border p-3 sm:p-4 shadow-xs space-y-3">
          {/* Main search row with mobile filter toggle button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input 
                type="text"
                value={searchQuery} 
                onChange={(e) => handleSearchChange(e.target.value)} 
                placeholder="Search by name, email, or number..." 
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

            {/* Mobile Filter Toggle Button */}
            <button
              type="button"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`md:hidden inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-medium transition-colors shrink-0 ${
                showMobileFilters || activeFiltersCount > 0
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-foreground hover:bg-muted"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  showMobileFilters ? "bg-white text-primary" : "bg-primary text-white"
                }`}>
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Dropdowns (Collapsible on Mobile, always grid on Desktop) */}
          <div className={`${showMobileFilters ? "grid" : "hidden md:grid"} grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 pt-2 md:pt-0 border-t md:border-t-0 border-border/60`}>
            <div>
              <label className="block text-[11px] sm:text-xs font-medium text-muted-foreground mb-1">Unit</label>
              <select value={unitNo} onChange={(e) => setUnitNo(e.target.value)} className="w-full px-2.5 py-1.5 sm:py-2 border border-border rounded-lg bg-input text-foreground text-xs sm:text-sm">
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
              <label className="block text-[11px] sm:text-xs font-medium text-muted-foreground mb-1">Year</label>
              <select value={enrollment} onChange={(e) => setEnrollment(e.target.value)} className="w-full px-2.5 py-1.5 sm:py-2 border border-border rounded-lg bg-input text-foreground text-xs sm:text-sm">
                <option value="all">All Years</option>
                <option value="first-year">1st Year</option>
                <option value="second-year">2nd Year</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] sm:text-xs font-medium text-muted-foreground mb-1">School</label>
              <select 
                value={schoolName} 
                onChange={(e) => setSchoolName(e.target.value)} 
                className="w-full px-2.5 py-1.5 sm:py-2 border border-border rounded-lg bg-input text-foreground text-xs sm:text-sm"
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
              <label className="block text-[11px] sm:text-xs font-medium text-muted-foreground mb-1">Sort By</label>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="w-full px-2.5 py-1.5 sm:py-2 border border-border rounded-lg bg-input text-foreground text-xs sm:text-sm"
              >
                <option value="hours-desc">Most Hours</option>
                <option value="hours-asc">Least Hours</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
              </select>
            </div>
          </div>

          {/* Active Filter Chips */}
          {activeFiltersCount > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/50 text-xs">
              <span className="text-[11px] text-muted-foreground mr-1">Active:</span>
              {unitNo !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium border border-primary/20">
                  Unit {unitNo}
                  <button type="button" onClick={() => setUnitNo("all")} className="hover:opacity-75">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {enrollment !== "all" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium border border-primary/20">
                  {enrollment === "first-year" ? "1st Year" : "2nd Year"}
                  <button type="button" onClick={() => setEnrollment("all")} className="hover:opacity-75">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {schoolName && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium border border-primary/20">
                  {schoolName.length > 15 ? schoolName.slice(0, 15) + "..." : schoolName}
                  <button type="button" onClick={() => setSchoolName("")} className="hover:opacity-75">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setUnitNo("all")
                  setEnrollment("all")
                  setSchoolName("")
                  setSortBy("hours-desc")
                }}
                className="text-[11px] text-primary hover:underline ml-auto font-medium"
              >
                Reset all
              </button>
            </div>
          )}
        </div>

        {/* Mobile View: Clean, Compact Cards (block md:hidden) */}
        <div className="block md:hidden space-y-3">
          {loading && volunteers.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center shadow-xs">
              <Loader2 className="animate-spin w-6 h-6 text-primary mx-auto" />
              <p className="text-xs text-muted-foreground mt-2">Loading volunteers...</p>
            </div>
          ) : displayVolunteers.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center shadow-xs">
              <Users className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <h3 className="mt-2 text-sm font-semibold text-foreground">
                {searchQuery ? "No volunteers match search" : "No volunteers found"}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {searchQuery
                  ? `No results for "${searchQuery}".`
                  : "Try clearing your filters."}
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
            displayVolunteers.map((volunteer) => (
              <div
                key={volunteer._id}
                className="bg-card rounded-xl border border-border p-3.5 shadow-xs hover:border-primary/40 transition-colors space-y-2.5"
              >
                {/* Header: Photo + Name/Email/Mobile + Unit Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border/80 shadow-xs">
                      {volunteer.application?.photo ? (
                        <img
                          src={volunteer.application.photo}
                          alt={volunteer.application?.nameEnglish || volunteer.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-sm ${volunteer.application?.photo ? 'hidden' : ''}`}>
                        {(volunteer.application?.nameEnglish || volunteer.name || "V").charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {volunteer.application?.nameEnglish || volunteer.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{volunteer.email}</p>
                      {volunteer.application?.mobileNo && (
                        <p className="text-[11px] text-muted-foreground font-mono">{volunteer.application.mobileNo}</p>
                      )}
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20 shrink-0">
                    {volunteer.application?.unitNo ? `Unit ${volunteer.application.unitNo}` : "No Unit"}
                  </span>
                </div>

                {/* School & Department */}
                {(volunteer.application?.schoolName || volunteer.application?.departmentName) && (
                  <div className="text-[11px] bg-muted/40 rounded-lg px-2.5 py-1.5 flex items-center justify-between text-muted-foreground">
                    <span className="font-medium text-foreground truncate max-w-[55%]">
                      {volunteer.application?.schoolName || "—"}
                    </span>
                    <span className="truncate max-w-[42%] text-right text-muted-foreground">
                      {volunteer.application?.departmentName || "—"}
                    </span>
                  </div>
                )}

                {/* Mini Metrics Row: Hours | Attendance | Projects | Events */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
                  <div className="bg-muted/30 rounded-lg p-1.5 border border-border/40">
                    <div className="font-bold text-foreground text-xs">{volunteer.stats.totalHours}h</div>
                    <div className="text-[10px] text-muted-foreground">Hours</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-1.5 border border-border/40">
                    <div className={`font-bold text-xs ${
                      volunteer.stats.attendanceRate >= 80
                        ? "text-green-600 dark:text-green-400"
                        : volunteer.stats.attendanceRate >= 50
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-red-600 dark:text-red-400"
                    }`}>
                      {volunteer.stats.attendanceRate}%
                    </div>
                    <div className="text-[10px] text-muted-foreground">Attd.</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-1.5 border border-border/40">
                    <div className="font-bold text-foreground text-xs">{volunteer.stats.projects}</div>
                    <div className="text-[10px] text-muted-foreground">Projects</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-1.5 border border-border/40">
                    <div className="font-bold text-foreground text-xs">{volunteer.stats.events}</div>
                    <div className="text-[10px] text-muted-foreground">Events</div>
                  </div>
                </div>

                {/* Actions & Status footer */}
                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <div className="text-[11px] text-muted-foreground">
                    {volunteer.application?.reviewedAt ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Approved {formatDate(volunteer.application.reviewedAt)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Active</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => fetchVolunteerDetail(volunteer._id)}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-medium transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    {volunteer.application?._id && (
                      <a
                        href={`/api/generate-pdf?id=${volunteer.application._id}`}
                        target="_blank"
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors border border-border/60"
                        title="Download Application PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setRemoveTarget({ id: volunteer._id, name: volunteer.application?.nameEnglish || volunteer.name })
                        setRemoveReason("")
                        setShowRemoveModal(true)
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors border border-border/60"
                      title="Remove Volunteer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop Volunteers Table (hidden on mobile) */}
        <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden relative">
          {isTableLoading && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 overflow-hidden z-10">
              <div className="h-full bg-primary animate-pulse w-full" />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className={`w-full transition-opacity duration-150 ${isTableLoading ? "opacity-75" : "opacity-100"}`}>
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
                {loading && volunteers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 className="animate-spin w-8 h-8 text-primary" />
                      </div>
                    </td>
                  </tr>
                ) : displayVolunteers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                      <h3 className="mt-2 text-sm font-medium text-foreground">
                        {searchQuery ? "No volunteers match your search" : "No volunteers found"}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {searchQuery
                          ? `No results found for "${searchQuery}". Try searching by name, email, or phone number.`
                          : "No volunteers match the selected filters."}
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
                  displayVolunteers.map((volunteer) => (
                    <tr key={volunteer._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border/80 shadow-xs">
                            {volunteer.application?.photo ? (
                              <img
                                src={volunteer.application.photo}
                                alt={volunteer.application?.nameEnglish || volunteer.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = 'none';
                                  (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-sm ${volunteer.application?.photo ? 'hidden' : ''}`}>
                              {(volunteer.application?.nameEnglish || volunteer.name || "V").charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground truncate">{volunteer.application?.nameEnglish || volunteer.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{volunteer.email}</p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                              {volunteer.application?.mobileNo && (
                                <span>{volunteer.application.mobileNo}</span>
                              )}
                              {volunteer.application?.reviewedAt && (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  Approved {formatDate(volunteer.application.reviewedAt)}
                                </span>
                              )}
                            </div>
                          </div>
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card rounded-xl border border-border px-4 py-3 sm:px-6 sm:py-4 shadow-xs">
            <div className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              {totalVolunteers > 0
                ? searchQuery
                  ? `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, totalVolunteers)} of ${totalVolunteers} found (${volunteers.length} total)`
                  : `Showing ${(currentPage - 1) * itemsPerPage + 1} to ${Math.min(currentPage * itemsPerPage, totalVolunteers)} of ${totalVolunteers} volunteers`
                : searchQuery
                  ? `0 volunteers found for "${searchQuery}"`
                  : "0 volunteers found"}
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading || isTableLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 border border-border rounded-lg text-xs sm:text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Previous</span>
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
                      className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? "bg-primary text-primary-foreground font-semibold"
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
                disabled={currentPage === totalPages || loading || isTableLoading}
                className="flex items-center gap-1 px-2.5 py-1.5 sm:px-3 sm:py-2 border border-border rounded-lg text-xs sm:text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Volunteer Detail Modal */}
        {showDetailModal && selectedVolunteer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl border border-border max-w-6xl w-full max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {/* Volunteer Photo Upload on Side */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-muted border-2 border-border flex-shrink-0 shadow-sm">
                    {selectedVolunteer.application?.photo || selectedVolunteer.photo ? (
                      <img
                        src={selectedVolunteer.application?.photo || selectedVolunteer.photo}
                        alt={selectedVolunteer.application?.nameEnglish || selectedVolunteer.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                          (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-2xl ${selectedVolunteer.application?.photo || selectedVolunteer.photo ? 'hidden' : ''}`}>
                      {(selectedVolunteer.application?.nameEnglish || selectedVolunteer.name || "V").charAt(0).toUpperCase()}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                      {selectedVolunteer.application?.nameEnglish || selectedVolunteer.name}
                    </h2>
                    <p className="text-muted-foreground flex items-center gap-2 mt-0.5 text-sm truncate">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{selectedVolunteer.email}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Approved on: {formatDate(selectedVolunteer.application?.reviewedAt || selectedVolunteer.application?.submittedAt)}
                      </span>
                      {selectedVolunteer.application?.unitNo && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                          Unit {selectedVolunteer.application.unitNo}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
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
                            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Application Approved Date
                            </p>
                            <p className="text-emerald-700 dark:text-emerald-400 font-semibold">
                              {formatDate(selectedVolunteer.application.reviewedAt || selectedVolunteer.application.submittedAt)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              Application Submitted Date
                            </p>
                            <p className="text-foreground font-medium">
                              {formatDate(selectedVolunteer.application.submittedAt)}
                            </p>
                          </div>
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

                    {/* Volunteer Uploaded Photo & Verification Documents */}
                    {selectedVolunteer.application && (
                      <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-primary" />
                          Volunteer Uploaded Photo & Documents
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                          {/* Volunteer Photo Card */}
                          <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center shadow-xs">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Volunteer Photo</span>
                            {selectedVolunteer.application.photo || selectedVolunteer.photo ? (
                              <a
                                href={selectedVolunteer.application.photo || selectedVolunteer.photo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative w-36 h-44 rounded-xl overflow-hidden border-2 border-border hover:border-primary transition-all shadow-sm"
                                title="Click to view full photo"
                              >
                                <img
                                  src={selectedVolunteer.application.photo || selectedVolunteer.photo}
                                  alt="Volunteer Uploaded Photo"
                                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium gap-1.5">
                                  <ExternalLink className="w-4 h-4" /> View Full
                                </div>
                              </a>
                            ) : (
                              <div className="w-36 h-44 rounded-xl bg-muted border border-dashed border-border flex flex-col items-center justify-center text-muted-foreground text-xs text-center p-3">
                                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                No photo uploaded
                              </div>
                            )}
                            <p className="text-[11px] text-muted-foreground mt-2">Passport-size uploaded photograph</p>
                          </div>

                          {/* Signature Card */}
                          {selectedVolunteer.application.signature && (
                            <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center shadow-xs">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Signature</span>
                              <a
                                href={selectedVolunteer.application.signature}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative w-44 h-24 rounded-xl overflow-hidden border-2 border-border hover:border-primary transition-all bg-white shadow-sm flex items-center justify-center p-2"
                                title="Click to view signature"
                              >
                                <img
                                  src={selectedVolunteer.application.signature}
                                  alt="Signature"
                                  className="max-w-full max-h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium gap-1.5">
                                  <ExternalLink className="w-4 h-4" /> View Full
                                </div>
                              </a>
                              <p className="text-[11px] text-muted-foreground mt-2">Volunteer digital signature</p>
                            </div>
                          )}

                          {/* Institutional ID Proof Card */}
                          {selectedVolunteer.application.institutionalIdProof && (
                            <div className="bg-card border border-border rounded-xl p-4 flex flex-col items-center shadow-xs">
                              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">ID Card Proof</span>
                              <a
                                href={selectedVolunteer.application.institutionalIdProof}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative w-44 h-28 rounded-xl overflow-hidden border-2 border-border hover:border-primary transition-all bg-white shadow-sm flex items-center justify-center p-2"
                                title="Click to view ID card"
                              >
                                <img
                                  src={selectedVolunteer.application.institutionalIdProof}
                                  alt="ID Card Proof"
                                  className="max-w-full max-h-full object-contain"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium gap-1.5">
                                  <ExternalLink className="w-4 h-4" /> View Full
                                </div>
                              </a>
                              <p className="text-[11px] text-muted-foreground mt-2">Institutional ID proof</p>
                            </div>
                          )}
                        </div>
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
