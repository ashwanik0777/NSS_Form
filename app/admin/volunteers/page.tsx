"use client"

import { useState, useEffect } from "react"
import AdminHeader from "@/components/admin/AdminHeader"
import { Users, Search, Download, UserPlus } from "lucide-react"

interface Volunteer {
  _id: string
  nameEnglish: string
  emailId: string
  institutionName: string
  mobileNo: string
  status: string
  enrollmentType: string
  submittedAt: string
}

export default function VolunteersPage() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchVolunteers()
  }, [statusFilter])

  const fetchVolunteers = async () => {
    try {
      const response = await fetch(`/api/applications?status=approved`)
      const data = await response.json()
      if (data.success) {
        setVolunteers(data.applications)
      }
    } catch (error) {
      console.error("Error fetching volunteers:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredVolunteers = volunteers.filter(
    (volunteer) =>
      volunteer.nameEnglish.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.emailId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.institutionName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <>
      <AdminHeader title="Volunteers" subtitle="Manage registered NSS volunteers" />

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Volunteers</p>
                <p className="text-2xl font-bold text-foreground">{volunteers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center">
              <UserPlus className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">First Year</p>
                <p className="text-2xl font-bold text-foreground">
                  {volunteers.filter((v) => v.enrollmentType === "first-year").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Second Year</p>
                <p className="text-2xl font-bold text-foreground">
                  {volunteers.filter((v) => v.enrollmentType === "second-year").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center">
              <Download className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">
                  {volunteers.filter((v) => new Date(v.submittedAt).getMonth() === new Date().getMonth()).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-card rounded-lg border border-border p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search volunteers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Status</option>
                <option value="approved">Active</option>
                <option value="suspended">Suspended</option>
              </select>
              <button className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Volunteers Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Volunteer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Institution
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Enrollment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredVolunteers.map((volunteer) => (
                  <tr key={volunteer._id} className="hover:bg-muted/25 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground font-medium">{volunteer.nameEnglish.charAt(0)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-foreground">{volunteer.nameEnglish}</div>
                          <div className="text-sm text-muted-foreground">{volunteer.emailId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{volunteer.institutionName}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        {volunteer.enrollmentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{volunteer.mobileNo}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(volunteer.submittedAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button className="text-primary hover:text-primary/80 text-sm font-medium transition-colors">
                          View
                        </button>
                        <button className="text-orange-600 hover:text-orange-500 text-sm font-medium transition-colors">
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredVolunteers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No volunteers found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchTerm ? "Try adjusting your search terms." : "No volunteers have been registered yet."}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
