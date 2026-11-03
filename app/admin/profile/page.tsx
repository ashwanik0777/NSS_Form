"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import AdminHeader from "@/components/admin/AdminHeader"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { User, Camera, Save, Loader2, Phone, Briefcase, Building, MapPin, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function AdminProfilePage() {
  const { data: session, update: updateSession } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    designation: "",
    department: "",
    address: "",
    photo: "",
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/admin/profile")
      const data = await res.json()
      if (data.success) {
        setFormData({
          name: data.user.name || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          designation: data.user.designation || "",
          department: data.user.department || "",
          address: data.user.address || "",
          photo: data.user.photo || "",
        })
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast({
        title: "Error",
        description: "Failed to load profile data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      })
      return
    }

    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (data.success) {
        setFormData((prev) => ({ ...prev, photo: data.url }))
        toast({
          title: "Success",
          description: "Photo uploaded successfully",
        })
      } else {
        throw new Error(data.message || "Upload failed")
      }
    } catch (error) {
      console.error("Error uploading photo:", error)
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive",
      })
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (data.success) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        })
        // Update session to reflect name change
        await updateSession()
      } else {
        throw new Error(data.message || "Update failed")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="sub-admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="sub-admin">
      <AdminHeader title="My Profile" subtitle="Update your profile information" />

      <div className="p-3 sm:p-5 md:p-6 max-w-4xl mx-auto">
        <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
          {/* Profile Photo Section */}
          <div className="p-4 sm:p-6 border-b border-border bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6">
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center overflow-hidden border-4 border-border shadow-md">
                  {formData.photo ? (
                    <img src={formData.photo} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
                  )}
                </div>
                <label
                  htmlFor="photo-upload"
                  className={`absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-lg ${uploadingPhoto ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-white animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={uploadingPhoto}
                  />
                </label>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1 break-words">{formData.name || "Admin User"}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 break-all">
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                  <span>{formData.email}</span>
                </p>
                {formData.designation && (
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                    <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                    <span>{formData.designation}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  Designation
                </label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData((prev) => ({ ...prev, designation: e.target.value }))}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  placeholder="e.g., Program Coordinator, NSS Officer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2 flex items-center gap-2">
                  <Building className="w-4 h-4 text-primary" />
                  Department
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  placeholder="Enter your department"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1.5 sm:mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                  rows={3}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  placeholder="Enter your address"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 sm:gap-4 pt-3 sm:pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => router.back()}
                className="w-full sm:w-auto px-6 py-2.5 sm:py-3 border border-border rounded-lg hover:bg-muted transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto px-6 py-2.5 sm:py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm font-medium shadow-xs"
              >
                {saving ? (
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
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}

