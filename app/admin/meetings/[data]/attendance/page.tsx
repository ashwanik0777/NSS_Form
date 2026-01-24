"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, ArrowLeft, CheckCircle, XCircle, Clock, Users, Save } from "lucide-react"
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

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/admin/meetings/${params.data}/attendance`)
      const result = await res.json()
      if (result.success) {
        setMeeting(result.meeting)
        setRegistrations(result.registrations)
        
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

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(registrations.map(r => r._id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string) => {
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{meeting?.title}</h1>
                    <p className="text-muted-foreground">Attendance Management</p>
                </div>
                <div className="flex items-center gap-3 bg-card p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-2">
                         <div className="text-sm font-medium">Meeting Hours:</div>
                         <input 
                            type="number" 
                            min="0" 
                            step="0.5" 
                            value={inputHours} 
                            onChange={(e) => setInputHours(Number(e.target.value))}
                            className="w-20 px-2 py-1 border rounded"
                         />
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
                                    checked={selectedIds.length === registrations.length && registrations.length > 0}
                                />
                            </th>
                            <th className="px-4 py-3 text-left">Volunteer</th>
                            <th className="px-4 py-3 text-left">Unit</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Hours Granted</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {registrations.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No registrations found.</td></tr>
                        ) : (
                            registrations.map(reg => (
                                <tr key={reg._id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.includes(reg._id)}
                                            onChange={() => handleSelectOne(reg._id)}
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium">{reg.name}</div>
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
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </ProtectedRoute>
  )
}
