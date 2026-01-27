"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, ArrowLeft, CheckCircle, XCircle, Clock, Users, Save, Search } from "lucide-react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

interface Registration {
  _id: string
  volunteerId: string
  name: string
  email: string
  unitNo: string
  status: "registered" | "attended" | "absent"
  hoursGranted: number
}

export default function MeetingAttendancePage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [meeting, setMeeting] = useState<any>(null)
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [inputHours, setInputHours] = useState<number>(0)
  const [updating, setUpdating] = useState(false)
  const [filterUnit, setFilterUnit] = useState("")
  const [searchName, setSearchName] = useState("")
  const [isToggling, setIsToggling] = useState(false)

  // Derived state for stats
  const stats = registrations.reduce((acc: any, reg) => {
    const unit = reg.unitNo || "Unknown"
    if (!acc[unit]) acc[unit] = { total: 0, attended: 0, absent: 0 }
    acc[unit].total++
    if (reg.status === "attended") acc[unit].attended++
    if (reg.status === "absent") acc[unit].absent++
    return acc
  }, {})

  const unitStats = Object.keys(stats).map(unit => ({
      unit,
      ...stats[unit]
  })).sort((a,b) => a.unit.localeCompare(b.unit))

  const toggleAttendanceWindow = async () => {
      setIsToggling(true)
      try {
          const res = await fetch("/api/admin/meetings", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  meetingId: meeting._id,
                  isAttendanceOpen: !meeting.isAttendanceOpen
              })
          })
          const data = await res.json()
          if(data.success) {
              setMeeting({ ...meeting, isAttendanceOpen: data.meeting.isAttendanceOpen })
          }
      } catch(e) {
          console.error("Failed to toggle", e)
      } finally {
          setIsToggling(false)
      }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/admin/meetings/${params.data}/attendance`)
      const result = await res.json()
      if (result.success) {
        setMeeting(result.meeting)
        
        // Deduplicate registrations by volunteerId
        const uniqueRegistrations = Object.values(
            result.registrations.reduce((acc: any, current: any) => {
                if (!acc[current.volunteerId]) {
                    acc[current.volunteerId] = current;
                }
                return acc;
            }, {})
        ) as Registration[];

        setRegistrations(uniqueRegistrations)
        
        // Calculate default hours based on start/end time
        if (result.meeting.startTime && result.meeting.endTime) {
            const start = new Date(result.meeting.startTime)
            const end = new Date(result.meeting.endTime)
            const diff = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
            setInputHours(Number(diff.toFixed(1)))
        } else {
            setInputHours(1) // Default to 1 hour
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filteredRegistrations = registrations.filter((r) => {
    const matchUnit = filterUnit ? r.unitNo === filterUnit : true
    const matchName = searchName 
        ? r.name.toLowerCase().includes(searchName.toLowerCase()) || r.email.toLowerCase().includes(searchName.toLowerCase())
        : true
    return matchUnit && matchName
  }).sort((a,b) => {
    // Primary Sort: Unit Number (Ascending)
    const unitA = parseInt(a.unitNo) || 9999;
    const unitB = parseInt(b.unitNo) || 9999;
    
    // Sort logic handled here to ensure 1, 2, 10 order not 1, 10, 2
    if (unitA !== unitB) {
        return unitA - unitB;
    }

    // Secondary Sort: Name (A-Z)
    return a.name.localeCompare(b.name)
  })

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      // Only select those who haven't been marked yet
      const selectableIds = filteredRegistrations
        .filter(r => r.status === 'registered')
        .map(r => r._id)
      setSelectedIds(selectableIds)
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string) => {
    // Only allow selection if status is registered (handled by checkbox disabled state too)
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleUpdateStatus = async (status: "attended" | "absent") => {
    if (selectedIds.length === 0) return
    setUpdating(true)
    try {
        const res = await fetch(`/api/admin/meetings/${params.data}/attendance`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                registrationIds: selectedIds,
                status,
                hoursGranted: status === "attended" ? inputHours : 0
            })
        })
        const data = await res.json()
        if (data.success) {
            await fetchData()
            setSelectedIds([])
        }
    } catch (error) {
        console.error("Update failed", error)
    } finally {
        setUpdating(false)
    }
  }

  if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <ProtectedRoute requiredRole="sub-admin" requiredPermission="events.manage">
        <div className="p-6">
            <button onClick={() => router.back()} className="mb-4 flex items-center text-sm text-muted-foreground hover:text-primary">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Meetings
            </button>
            <div className="flex flex-col gap-6 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold">{meeting?.title}</h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                           Attendance Management 
                           <span className={`px-2 py-0.5 rounded-full text-xs ${meeting?.isAttendanceOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                               {meeting?.isAttendanceOpen ? 'Active' : 'Closed'}
                           </span>
                        </p>
                    </div>
                     <div className="flex items-center gap-3">
                         {meeting && (
                             <button
                                onClick={toggleAttendanceWindow}
                                disabled={isToggling}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    meeting.isAttendanceOpen 
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                             >
                                 {meeting.isAttendanceOpen ? 'Stop Attendance' : 'Open Attendance'}
                             </button>
                         )}
                         <div className="flex items-center gap-2 bg-card p-2 rounded-lg border border-border">
                             <div className="text-sm font-medium whitespace-nowrap">Hours to Grant:</div>
                             <input 
                                type="number" 
                                min="0" 
                                step="0.5" 
                                value={inputHours} 
                                onChange={(e) => setInputHours(Number(e.target.value))}
                                className="w-16 px-2 py-1 border rounded text-right"
                             />
                         </div>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     <div className="bg-white p-4 rounded-lg border">
                         <div className="text-sm text-muted-foreground">Total Registered</div>
                         <div className="text-2xl font-bold">{registrations.length}</div>
                     </div>
                     <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                         <div className="text-sm text-green-600">Present</div>
                         <div className="text-2xl font-bold text-green-700">
                             {registrations.filter(r => r.status === 'attended').length}
                         </div>
                     </div>
                     <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                         <div className="text-sm text-red-600">Absent</div>
                         <div className="text-2xl font-bold text-red-700">
                             {registrations.filter(r => r.status === 'absent').length}
                         </div>
                     </div>
                     <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                         <div className="text-sm text-gray-600">Pending</div>
                         <div className="text-2xl font-bold text-gray-700">
                             {registrations.filter(r => r.status === 'registered').length}
                         </div>
                     </div>
                </div>

                {/* Unit Wise Breakdown */}
                <div className="bg-white p-4 rounded-lg border">
                    <h3 className="font-semibold mb-3">Unit-wise Summary</h3>
                    <div className="flex flex-wrap gap-2">
                        {unitStats.map(stat => (
                            <div key={stat.unit} className="px-3 py-1.5 bg-gray-50 rounded border text-sm">
                                <span className="font-medium">Unit {stat.unit}:</span> {stat.attended}/{stat.total} Present
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex gap-4 p-4 bg-gray-50 rounded-lg border items-center flex-wrap">
                    <div className="flex-1 min-w-[300px]">
                        <label className="text-xs font-semibold uppercase text-gray-500 mb-1 block">Search Volunteer</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input 
                                type="text"
                                placeholder="Search by name or email..." 
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>
                    </div>
                    <div className="w-48">
                        <label className="text-xs font-semibold uppercase text-gray-500 mb-1 block">Filter by Unit</label>
                        <select 
                            value={filterUnit} 
                            onChange={(e) => setFilterUnit(e.target.value)}
                            className="w-full px-3 py-2 bg-white border rounded"
                        >
                            <option value="">All Units</option>
                            {unitStats.map(s => <option key={s.unit} value={s.unit}>Unit {s.unit}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mb-4">
                <button 
                    onClick={() => handleUpdateStatus("attended")}
                    disabled={selectedIds.length === 0 || updating}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                >
                    <CheckCircle className="w-4 h-4" /> Mark Attended ({selectedIds.length})
                </button>
                <button 
                    onClick={() => handleUpdateStatus("absent")}
                    disabled={selectedIds.length === 0 || updating}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                >
                    <XCircle className="w-4 h-4" /> Mark Absent ({selectedIds.length})
                </button>
            </div>

            <div className="bg-white border rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                        <tr>
                            <th className="px-4 py-3 w-10">
                                <input 
                                    type="checkbox" 
                                    onChange={handleSelectAll} 
                                    checked={
                                        filteredRegistrations.some(r => r.status === 'registered') && 
                                        filteredRegistrations
                                            .filter(r => r.status === 'registered')
                                            .every(r => selectedIds.includes(r._id))
                                    }
                                />
                            </th>
                            <th className="px-4 py-3 text-left">Volunteer</th>
                            <th className="px-4 py-3 text-left">Unit</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Hours Granted</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredRegistrations.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No matching volunteers found.</td></tr>
                        ) : (
                            filteredRegistrations.map(reg => {
                                const isProcessed = reg.status !== "registered"
                                return (
                                <tr key={reg._id} className={`hover:bg-gray-50 ${isProcessed ? 'bg-gray-50/50' : ''}`}>
                                    <td className="px-4 py-3">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.includes(reg._id)}
                                            onChange={() => handleSelectOne(reg._id)}
                                            disabled={isProcessed}
                                            className="disabled:opacity-50"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className={`font-medium ${isProcessed ? 'text-muted-foreground' : ''}`}>{reg.name}</div>
                                        <div className="text-xs text-muted-foreground">{reg.email}</div>
                                    </td>
                                    <td className="px-4 py-3">{reg.unitNo}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            reg.status === 'attended' ? 'bg-green-100 text-green-800' :
                                            reg.status === 'absent' ? 'bg-red-100 text-red-800' :
                                            'bg-blue-100 text-blue-800'
                                        }`}>
                                            {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-medium">
                                        {reg.status === 'attended' ? reg.hoursGranted : '-'}
                                    </td>
                                </tr>
                            )})
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </ProtectedRoute>
  )
}
