"use client"

import { useState, useEffect, useRef } from "react"
import { PERMISSION_CATEGORIES, getPermissionsByCategory } from "@/lib/permissions"
import { Loader2, UserPlus, Pencil, Trash2, X, Shield, Users } from "lucide-react"

interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "sub-admin" | "user" | "volunteer"
  permissions: string[]
  createdAt: string
  updatedAt: string
  status?: string
  hierarchy?: string
  assignedUnits?: string[]
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "sub-admin" as "admin" | "sub-admin" | "user" | "volunteer",
    hierarchy: "",
    permissions: [] as string[],
    password: "",
    assignedUnits: [] as string[],
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [searching, setSearching] = useState(false)

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  const searchVolunteers = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    setSearching(true)
    try {
      const response = await fetch(`/api/admin/users/search-volunteers?q=${encodeURIComponent(query)}`)
      const data = await response.json()
      if (data.success) {
        setSearchResults(data.volunteers || [])
        setShowSearchResults(true)
      }
    } catch (error) {
      console.error("Error searching volunteers:", error)
    } finally {
      setSearching(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    setFormData((prev) => ({ ...prev, name: value }))

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchVolunteers(value)
    }, 300)
  }

  const selectVolunteer = (volunteer: any) => {
    setFormData((prev) => ({
      ...prev,
      name: volunteer.name,
      email: volunteer.email,
    }))
    setSearchQuery(volunteer.name)
    setShowSearchResults(false)
    setSearchResults([])
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      const data = await response.json()
      if (data.success) {
        setUsers(data.users)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (creating) return
    setCreating(true)
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (data.success) {
        setShowCreateModal(false)
        setFormData({ name: "", email: "", role: "sub-admin", hierarchy: "", permissions: [], password: "", assignedUnits: [] })
        setSearchQuery("")
        setShowSearchResults(false)
        setSearchResults([])
        fetchUsers()
        alert("Sub-Admin created successfully! Email sent with login credentials.")
      } else {
        alert("Error creating user: " + data.message)
      }
    } catch (error) {
      console.error("Error creating user:", error)
      alert("Error creating user")
    } finally {
      setCreating(false)
    }
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/admin/users/${selectedUser._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      if (data.success) {
        setShowEditModal(false)
        setSelectedUser(null)
        setFormData({ name: "", email: "", role: "sub-admin", hierarchy: "", permissions: [], password: "", assignedUnits: [] })
        setSearchQuery("")
        setShowSearchResults(false)
        setSearchResults([])
        fetchUsers()
      } else {
        alert("Error updating user: " + data.message)
      }
    } catch (error) {
      console.error("Error updating user:", error)
      alert("Error updating user")
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      const data = await response.json()
      if (data.success) {
        fetchUsers()
      } else {
        alert("Error deleting user: " + data.message)
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("Error deleting user")
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      hierarchy: (user as any).hierarchy || "",
      permissions: user.permissions || [],
      password: "",
      assignedUnits: (user as any).assignedUnits || [],
    })
    setSearchQuery(user.name)
    setShowEditModal(true)
  }

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setFormData((prev) => ({
        ...prev,
        permissions: [...prev.permissions, permission],
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        permissions: prev.permissions.filter((p) => p !== permission),
      }))
    }
  }

  const getRoleBadge = (role: string) => {
    const roleStyles = {
      admin: "bg-red-100 text-red-800 border-red-200",
      "sub-admin": "bg-blue-100 text-blue-800 border-blue-200",
      volunteer: "bg-green-100 text-green-800 border-green-200",
      user: "bg-gray-100 text-gray-800 border-gray-200",
    }

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full border ${roleStyles[role as keyof typeof roleStyles] || roleStyles.user}`}
      >
        {role.charAt(0).toUpperCase() + role.slice(1).replace("-", " ")}
      </span>
    )
  }

  const permissionsByCategory = getPermissionsByCategory()

  // Users are already filtered by API (excluding role "user")
  const acceptedUsers = users

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-end items-center mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-xs font-medium text-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Create Sub-Admin
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {acceptedUsers.map((user) => (
                <tr key={user._id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-foreground">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-foreground">{user.permissions.length} permissions</div>
                    {(user as any).assignedUnits && (user as any).assignedUnits.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        Units: {(user as any).assignedUnits.join(", ")}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="inline-flex items-center text-primary hover:text-primary/80 text-sm font-medium px-2 py-1 rounded hover:bg-primary/10 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5 mr-1" />
                        Edit
                      </button>
                      {user.role !== "admin" && (
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="inline-flex items-center text-destructive hover:text-destructive/80 text-sm font-medium px-2 py-1 rounded hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in">
          <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl p-5 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto smooth-modal">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Create Sub-Admin</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setFormData({ name: "", email: "", role: "sub-admin", hierarchy: "", permissions: [], password: "", assignedUnits: [] })
                  setSearchQuery("")
                  setShowSearchResults(false)
                  setSearchResults([])
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowSearchResults(true)
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowSearchResults(false), 200)
                    }}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                    placeholder="Type name to search volunteers..."
                  />
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((volunteer) => (
                        <button
                          key={volunteer._id}
                          type="button"
                          onClick={() => selectVolunteer(volunteer)}
                          className="w-full text-left px-4 py-2 hover:bg-muted transition-colors border-b border-border last:border-b-0"
                        >
                          <div className="font-medium text-foreground">{volunteer.name}</div>
                          <div className="text-sm text-muted-foreground">{volunteer.email}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searching && (
                    <div className="absolute right-3 top-9 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                    placeholder="Email will auto-fill when you select a volunteer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Hierarchy/Role</label>
                <select
                  value={formData.hierarchy}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hierarchy: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                >
                  <option value="">Select role</option>
                  <option value="convener">Convener</option>
                  <option value="co-convener">Co-Convener</option>
                  <option value="president">President</option>
                  <option value="vice-president">Vice President</option>
                  <option value="secretary">Secretary</option>
                  <option value="treasurer">Treasurer</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="member">Member</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                >
                  <option value="sub-admin">Sub-Admin</option>
                  <option value="user">User</option>
                  <option value="volunteer">Volunteer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Password (Optional - leave blank to auto-generate)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                  placeholder="Enter password (min 6 chars) or leave blank"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  If left blank, a temporary password will be generated and sent via email
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Assigned Units</label>
                <div className="space-y-2 border border-border rounded-md p-3 max-h-40 overflow-y-auto">
                  {["1", "2", "3", "4", "5", "6"].map((unit) => (
                    <label key={unit} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.assignedUnits.includes(unit)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData((prev) => ({
                              ...prev,
                              assignedUnits: [...prev.assignedUnits, unit],
                            }))
                          } else {
                            setFormData((prev) => ({
                              ...prev,
                              assignedUnits: prev.assignedUnits.filter((u) => u !== unit),
                            }))
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-foreground">Unit {unit}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Select units this sub-admin can manage. Leave empty for all units.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Permissions</label>
                <div className="space-y-4 max-h-60 overflow-y-auto border border-border rounded-md p-4">
                  {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                    <div key={category}>
                      <h4 className="font-medium text-foreground mb-2">
                        {PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES]}
                      </h4>
                      <div className="space-y-2 ml-4">
                        {permissions.map(({ key, description }) => (
                          <label key={key} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.permissions.includes(key)}
                              onChange={(e) => handlePermissionChange(key, e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-sm text-foreground">{description}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setFormData({ name: "", email: "", role: "sub-admin", hierarchy: "", permissions: [], password: "", assignedUnits: [] })
        setSearchQuery("")
        setShowSearchResults(false)
        setSearchResults([])
                }}
                className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-md hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={!formData.name || !formData.email || creating}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "Creating..." : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in">
          <div className="bg-card text-card-foreground border border-border rounded-2xl shadow-2xl p-5 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto smooth-modal">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Edit User</h3>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                  setFormData({ name: "", email: "", role: "sub-admin", hierarchy: "", permissions: [], password: "", assignedUnits: [] })
                  setSearchQuery("")
                  setShowSearchResults(false)
                  setSearchResults([])
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                    disabled={selectedUser.role === "admin"}
                  />
                </div>
              </div>

                  {selectedUser.role !== "admin" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Role</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                    >
                      <option value="sub-admin">Sub-Admin</option>
                      <option value="user">User</option>
                      <option value="volunteer">Volunteer (Demote)</option>
                    </select>
                  </div>

                  {formData.role !== "volunteer" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Hierarchy/Role</label>
                        <select
                          value={formData.hierarchy}
                          onChange={(e) => setFormData((prev) => ({ ...prev, hierarchy: e.target.value }))}
                          className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                        >
                          <option value="">Select role</option>
                          <option value="convener">Convener</option>
                          <option value="co-convener">Co-Convener</option>
                          <option value="president">President</option>
                          <option value="vice-president">Vice President</option>
                          <option value="secretary">Secretary</option>
                          <option value="treasurer">Treasurer</option>
                          <option value="coordinator">Coordinator</option>
                          <option value="member">Member</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Assigned Units</label>
                        <div className="space-y-2 border border-border rounded-md p-3 max-h-40 overflow-y-auto">
                          {["1", "2", "3", "4", "5", "6"].map((unit) => (
                            <label key={unit} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.assignedUnits.includes(unit)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData((prev) => ({
                                      ...prev,
                                      assignedUnits: [...prev.assignedUnits, unit],
                                    }))
                                  } else {
                                    setFormData((prev) => ({
                                      ...prev,
                                      assignedUnits: prev.assignedUnits.filter((u) => u !== unit),
                                    }))
                                  }
                                }}
                                className="mr-2"
                              />
                              <span className="text-sm text-foreground">Unit {unit}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Permissions</label>
                        <div className="space-y-4 max-h-60 overflow-y-auto border border-border rounded-md p-4">
                          {Object.entries(permissionsByCategory).map(([category, permissions]) => (
                            <div key={category}>
                              <h4 className="font-medium text-foreground mb-2">
                                {PERMISSION_CATEGORIES[category as keyof typeof PERMISSION_CATEGORIES]}
                              </h4>
                              <div className="space-y-2 ml-4">
                                {permissions.map(({ key, description }) => (
                                  <label key={key} className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={formData.permissions.includes(key)}
                                      onChange={(e) => handlePermissionChange(key, e.target.checked)}
                                      className="mr-2"
                                    />
                                    <span className="text-sm text-foreground">{description}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                  setFormData({ name: "", email: "", role: "sub-admin", hierarchy: "", permissions: [], password: "", assignedUnits: [] })
        setSearchQuery("")
        setShowSearchResults(false)
        setSearchResults([])
                }}
                className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-md hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Update User
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
