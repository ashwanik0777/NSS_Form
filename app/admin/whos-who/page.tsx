"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Loader2,
  CheckCircle2,
  X,
  ExternalLink,
  Shield,
  Building,
  Mail,
  Phone,
  Image as ImageIcon,
  AlertCircle,
} from "lucide-react"

interface Member {
  _id: string
  name: string
  designation: string
  category: "coordinator" | "officer" | "mentor" | "other"
  unitNo: string
  department?: string
  school?: string
  email?: string
  phone?: string
  photo?: string
  bio?: string
  order: number
  isActive: boolean
}

const UNIT_OPTIONS = [
  "All Units",
  "Unit 1",
  "Unit 2",
  "Unit 3",
  "Unit 4",
  "Unit 5",
  "Unit 6",
]

export default function AdminWhosWhoPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUnitFilter, setSelectedUnitFilter] = useState("All")
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [modalError, setModalError] = useState("")

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    designation: "Program Officer (PO)",
    category: "officer" as "coordinator" | "officer" | "mentor" | "other",
    unitNo: "Unit 1",
    department: "",
    school: "",
    email: "",
    phone: "",
    photo: "",
    bio: "",
    order: 0,
    isActive: true,
  })

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/whos-who")
      const data = await res.json()
      if (data.success && Array.isArray(data.members)) {
        setMembers(data.members)
      }
    } catch (error) {
      console.error("Error fetching leadership:", error)
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingId(null)
    setFormData({
      name: "",
      designation: "Program Officer (PO)",
      category: "officer",
      unitNo: "Unit 1",
      department: "",
      school: "",
      email: "",
      phone: "",
      photo: "",
      bio: "",
      order: members.length + 1,
      isActive: true,
    })
    setModalError("")
    setIsModalOpen(true)
  }

  const openEditModal = (member: Member) => {
    setEditingId(member._id)
    setFormData({
      name: member.name,
      designation: member.designation,
      category: member.category,
      unitNo: member.unitNo,
      department: member.department || "",
      school: member.school || "",
      email: member.email || "",
      phone: member.phone || "",
      photo: member.photo || "",
      bio: member.bio || "",
      order: member.order,
      isActive: member.isActive,
    })
    setModalError("")
    setIsModalOpen(true)
  }

  // Handle Photo Upload directly to Cloudinary
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    setModalError("")

    try {
      const uploadData = new FormData()
      uploadData.append("file", file)
      uploadData.append("folder", "nss-uploads/leadership")

      const res = await fetch("/api/upload/cloudinary", {
        method: "POST",
        body: uploadData,
      })

      const data = await res.json()
      if (data.success && data.url) {
        setFormData((prev) => ({ ...prev, photo: data.url }))
      } else {
        setModalError(data.message || "Photo upload failed")
      }
    } catch (error: any) {
      setModalError("Photo upload failed: " + (error.message || "Unknown error"))
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.designation.trim()) {
      setModalError("Name and Designation are required.")
      return
    }

    setSaving(true)
    setModalError("")

    try {
      const url = editingId ? `/api/admin/whos-who/${editingId}` : "/api/admin/whos-who"
      const method = editingId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (data.success) {
        setIsModalOpen(false)
        fetchMembers()
      } else {
        setModalError(data.message || "Failed to save member")
      }
    } catch (error: any) {
      setModalError(error.message || "An error occurred while saving.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return

    try {
      const res = await fetch(`/api/admin/whos-who/${id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        fetchMembers()
      } else {
        alert(data.message || "Failed to delete")
      }
    } catch (error) {
      alert("Error deleting member")
    }
  }

  const filteredMembers =
    selectedUnitFilter === "All"
      ? members
      : members.filter((m) => m.unitNo === selectedUnitFilter)

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-7 h-7 text-primary" />
            Who's Who Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage Program Officers (POs), Faculty Mentors, and Leadership across all 6 Units.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/whos-who"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-slate-300 dark:border-border hover:bg-slate-100 dark:hover:bg-muted text-slate-700 dark:text-slate-200 transition-colors"
          >
            <ExternalLink className="w-4 h-4 text-primary" />
            View Public Page
          </Link>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none">
        {["All", ...UNIT_OPTIONS].map((unit) => (
          <button
            key={unit}
            onClick={() => setSelectedUnitFilter(unit)}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
              selectedUnitFilter === unit
                ? "bg-slate-900 text-white dark:bg-primary dark:text-primary-foreground shadow-xs"
                : "bg-white dark:bg-card border border-slate-200 dark:border-border text-slate-600 dark:text-slate-300 hover:bg-slate-50"
            }`}
          >
            {unit}
          </button>
        ))}
      </div>

      {/* Members Grid / List */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
          <p className="text-sm text-slate-500">Loading members...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="bg-white dark:bg-card rounded-2xl border border-dashed border-slate-300 dark:border-border p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">
            No Members Found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Get started by adding Program Officers and Mentors for the selected unit.
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
          >
            + Add First Member
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMembers.map((member) => (
            <div
              key={member._id}
              className="bg-white dark:bg-card rounded-2xl border border-slate-200/80 dark:border-border/60 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 dark:bg-muted border border-slate-200 shrink-0">
                      {member.photo ? (
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                          {member.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 mb-0.5">
                        {member.unitNo}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                        {member.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                        {member.designation}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      member.isActive ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                    title={member.isActive ? "Active" : "Inactive"}
                  />
                </div>

                {(member.department || member.school) && (
                  <div className="mt-3 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 truncate">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{member.department || member.school}</span>
                  </div>
                )}

                {member.email && (
                  <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 bg-slate-50 dark:bg-muted/30 border-t border-slate-100 dark:border-border/50 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Order: #{member.order}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(member)}
                    className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-muted text-slate-600 dark:text-slate-300 transition-colors"
                    title="Edit Member"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(member._id, member.name)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                    title="Delete Member"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-card border border-slate-200 dark:border-border rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-border flex items-center justify-between">
              <h2 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                {editingId ? "Edit Member" : "Add Leadership Member"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {modalError && (
                <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs font-medium border border-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {modalError}
                </div>
              )}

              {/* Photo Upload Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Faculty / Officer Photo
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full border-2 border-slate-200 dark:border-border overflow-hidden bg-slate-100 dark:bg-muted flex items-center justify-center shrink-0">
                    {formData.photo ? (
                      <img
                        src={formData.photo}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-muted hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer transition-colors">
                      {uploadingPhoto ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          Uploading to Cloudinary...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-primary" />
                          Upload Photo
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                        disabled={uploadingPhoto}
                      />
                    </label>

                    {formData.photo && (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, photo: "" }))}
                        className="block text-xs text-red-500 hover:underline"
                      >
                        Remove Photo
                      </button>
                    )}
                    <p className="text-[11px] text-slate-400">
                      JPG, PNG or WEBP (Max 5MB). Uploads securely to Cloudinary.
                    </p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Jane Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Designation & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Designation *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Program Officer (PO)"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Role Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="officer">Program Officer</option>
                    <option value="mentor">Faculty Mentor</option>
                    <option value="coordinator">Program Coordinator</option>
                    <option value="other">Staff / Member</option>
                  </select>
                </div>
              </div>

              {/* Unit Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Assigned Unit
                  </label>
                  <select
                    value={formData.unitNo}
                    onChange={(e) => setFormData({ ...formData, unitNo: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) =>
                      setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Department / School */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  School / Department
                </label>
                <input
                  type="text"
                  placeholder="e.g. School of Information & Communication Technology"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    placeholder="po.unit1@gbu.ac.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 ..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Bio / Quote */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Short Bio / Responsibilities
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief note on duties or message for volunteers..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-primary rounded"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Visible on Public "Who's Who" Directory
                </label>
              </div>

              {/* Form Buttons */}
              <div className="pt-4 border-t border-slate-200 dark:border-border flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingPhoto}
                  className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Member"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

