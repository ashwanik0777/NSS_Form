"use client"

import { useState, useEffect } from "react"
import { PERMISSION_CATEGORIES, getPermissionsByCategory } from "@/lib/permissions"

interface User {
  _id: string
  name: string
  email: string
  role: "admin" | "sub-admin" | "user"
  permissions: string[]
  createdAt: string
  updatedAt: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "sub-admin" as "admin" | "sub-admin" | "user",
    permissions: [] as string[],
  })

  useEffect(() => {
    fetchUsers()
  }, [])

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
        setFormData({ name: "", email: "", role: "sub-admin", permissions: [] })
        fetchUsers()
      } else {
        alert("Error creating user: " + data.message)
      }
    } catch (error) {
      console.error("Error creating user:", error)
      alert("Error creating user")
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
        setFormData({ name: "", email: "", role: "sub-admin", permissions: [] })
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
      permissions: user.permissions,
    })
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
      user: "bg-gray-100 text-gray-800 border-gray-200",
    }

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full border ${roleStyles[role as keyof typeof roleStyles]}`}
      >
        {role.charAt(0).toUpperCase() + role.slice(1).replace("-", " ")}
      </span>
    )
  }

  const permissionsByCategory = getPermissionsByCategory()

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-muted-foreground">Manage admin users and their permissions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Create Sub-Admin
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-muted/25">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-foreground">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-muted-foreground">{user.permissions.length} permissions</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-primary hover:text-primary/80 text-sm font-medium"
                      >
                        Edit
                      </button>
                      {user.role !== "admin" && (
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-destructive hover:text-destructive/80 text-sm font-medium"
                        >
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-foreground mb-4">Create Sub-Admin</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground"
                    placeholder="Enter email address"
                  />
                </div>
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
                </select>
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
                  setFormData({ name: "", email: "", role: "sub-admin", permissions: [] })
                }}
                className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-md hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateUser}
                disabled={!formData.name || !formData.email}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-foreground mb-4">Edit User</h3>

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
                    </select>
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
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setSelectedUser(null)
                  setFormData({ name: "", email: "", role: "sub-admin", permissions: [] })
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
