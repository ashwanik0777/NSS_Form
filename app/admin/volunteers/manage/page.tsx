"use client"

import { useState, useEffect } from "react"
import { Search, Edit, Save, X, Loader2, AlertCircle } from "lucide-react"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import AdminHeader from "@/components/admin/AdminHeader"

export default function ManageVolunteersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [editingVolunteer, setEditingVolunteer] = useState<any>(null)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Use debounce for search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearch()
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const handleSearch = async () => {
    setLoading(true)
    try {
      // Use existing search endpoint if available or filter from list
      // We can use the user search endpoint which returns volunteers
      const res = await fetch(`/api/admin/users/search-volunteers?q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (data.success) {
        setSearchResults(data.volunteers || [])
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditClick = async (volunteer: any) => {
    // Fetch detailed info first to get application details
    setUpdateLoading(true)
    try {
      const res = await fetch(`/api/admin/volunteer-management?volunteerId=${volunteer._id}`)
      const data = await res.json()
      
      if (data.success && data.volunteer) {
        const vol = data.volunteer
        const app = vol.application || {}
        
        setEditingVolunteer({
            _id: volunteer._id,
            name: vol.name,
            email: vol.email,
            mobileNo: app.mobileNo || "",
            enrollmentNo: app.institutionalIdCard || "",
            unit: app.unitNo || "",
            fatherName: app.fatherName || "",
            course: app.courseName || "",
            department: app.departmentName || "",
            category: app.category || "",
        })
        setMessage(null)
      } else {
        setMessage({ type: "error", text: "Failed to fetch volunteer details" })
      }
    } catch (e) {
       console.error(e)
       setMessage({ type: "error", text: "Error fetching details" })
    } finally {
        setUpdateLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingVolunteer) return

    setUpdateLoading(true)
    setMessage(null)

    try {
      const res = await fetch("/api/admin/volunteer-management", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          volunteerId: editingVolunteer._id,
          ...editingVolunteer
        }),
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: "success", text: "Volunteer updated successfully" })
        setEditingVolunteer(null)
        handleSearch() // Refresh list
      } else {
        setMessage({ type: "error", text: data.message || "Failed to update" })
      }
    } catch (error) {
      console.error("Update error:", error)
      setMessage({ type: "error", text: "Failed to update volunteer" })
    } finally {
      setUpdateLoading(false)
    }
  }

  return (
    <ProtectedRoute requiredRole="sub-admin" requiredPermission="volunteers.edit">
      <AdminHeader title="Manage Volunteer Data" subtitle="Search and update volunteer details to fix data mismatches" />

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Search Section */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email, or enrollment no..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Results List */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
           <div className="px-6 py-4 border-b border-border bg-muted/30">
             <h3 className="font-semibold">Search Results</h3>
           </div>
           
           {loading ? (
             <div className="p-8 flex justify-center">
               <Loader2 className="w-6 h-6 animate-spin text-primary" />
             </div>
           ) : searchResults.length > 0 ? (
             <div className="divide-y divide-border">
               {searchResults.map((vol) => (
                 <div key={vol._id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                   <div>
                     <p className="font-medium">{vol.name}</p>
                     <p className="text-sm text-muted-foreground">{vol.email}</p>
                   </div>
                   <button
                     onClick={() => handleEditClick(vol)}
                     className="px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors flex items-center gap-2"
                   >
                     <Edit className="w-4 h-4" />
                     Edit Details
                   </button>
                 </div>
               ))}
             </div>
           ) : (
             <div className="p-8 text-center text-muted-foreground">
               {searchQuery.length < 2 ? "Type at least 2 characters to search" : "No volunteers found"}
             </div>
           )}
        </div>

        {/* Edit Modal */}
        {editingVolunteer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-card rounded-xl border border-border w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card rounded-t-xl z-10">
                <h3 className="text-xl font-bold">Edit Volunteer Details</h3>
                <button
                  onClick={() => setEditingVolunteer(null)}
                  className="p-2 hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="p-6 overflow-y-auto space-y-4">
                 {/* Basic Info */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium mb-1 block">Full Name</label>
                        <input
                            type="text"
                            value={editingVolunteer.name}
                            onChange={(e) => setEditingVolunteer({...editingVolunteer, name: e.target.value})}
                            className="w-full px-3 py-2 border border-border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Email</label>
                        <input
                            type="email"
                            value={editingVolunteer.email}
                            onChange={(e) => setEditingVolunteer({...editingVolunteer, email: e.target.value})}
                            className="w-full px-3 py-2 border border-border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Mobile No</label>
                        <input
                            type="text"
                            value={editingVolunteer.mobileNo}
                            onChange={(e) => setEditingVolunteer({...editingVolunteer, mobileNo: e.target.value})}
                            className="w-full px-3 py-2 border border-border rounded-lg"
                        />
                    </div>
                     <div>
                        <label className="text-sm font-medium mb-1 block">Enrollment No / ID Card</label>
                        <input
                            type="text"
                            value={editingVolunteer.enrollmentNo}
                            onChange={(e) => setEditingVolunteer({...editingVolunteer, enrollmentNo: e.target.value})}
                            className="w-full px-3 py-2 border border-border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Father's Name</label>
                        <input
                            type="text"
                            value={editingVolunteer.fatherName}
                            onChange={(e) => setEditingVolunteer({...editingVolunteer, fatherName: e.target.value})}
                            className="w-full px-3 py-2 border border-border rounded-lg"
                        />
                    </div>
                     <div>
                        <label className="text-sm font-medium mb-1 block">Unit Number</label>
                        <select
                            value={editingVolunteer.unit}
                            onChange={(e) => setEditingVolunteer({...editingVolunteer, unit: e.target.value})}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                        >
                            <option value="">Select Unit</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(u => (
                                <option key={u} value={u.toString()}>{u}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Course</label>
                        <input
                            type="text"
                            value={editingVolunteer.course}
                            onChange={(e) => setEditingVolunteer({...editingVolunteer, course: e.target.value})}
                            className="w-full px-3 py-2 border border-border rounded-lg"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1 block">Department</label>
                        <input
                            type="text"
                            value={editingVolunteer.department}
                            onChange={(e) => setEditingVolunteer({...editingVolunteer, department: e.target.value})}
                            className="w-full px-3 py-2 border border-border rounded-lg"
                        />
                    </div>
                     <div>
                        <label className="text-sm font-medium mb-1 block">Category</label>
                         <select
                            value={editingVolunteer.category}
                            onChange={(e) => setEditingVolunteer({...editingVolunteer, category: e.target.value})}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                        >
                            <option value="">Select Category</option>
                            <option value="general">General</option>
                            <option value="obc">OBC</option>
                            <option value="sc">SC</option>
                            <option value="st">ST</option>
                            <option value="ews">EWS</option>
                        </select>
                    </div>
                 </div>

                 {message && (
                     <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                         <AlertCircle className="w-4 h-4" />
                         {message.text}
                     </div>
                 )}
              </form>

              <div className="p-6 border-t border-border bg-muted/10 flex justify-end gap-3 sticky bottom-0 rounded-b-xl">
                 <button
                    type="button"
                    onClick={() => setEditingVolunteer(null)}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                 >
                    Cancel
                 </button>
                 <button
                    onClick={handleUpdate}
                    disabled={updateLoading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                 >
                    {updateLoading ? (
                        <>
                         <Loader2 className="w-4 h-4 animate-spin" />
                         Saving...
                        </>
                    ) : (
                        <>
                         <Save className="w-4 h-4" />
                         Save Changes
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
