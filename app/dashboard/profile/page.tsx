"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, User, CheckCircle, AlertCircle, Save, Upload, Camera, FileText, Link2, Award, X } from "lucide-react"

interface ProfileData {
  photo?: string
  signature?: string
  institutionalIdCard?: string
  highSchoolCertificate?: string
  myBharatPortalRegistered?: boolean
  myBharatPortalId?: string
  myBharatPortalScreenshot?: string
  socialFacebook?: string
  socialInstagram?: string
  socialTwitter?: string
  socialLinkedin?: string
  [key: string]: any
}

interface CompletionData {
  percent: number
  missing: string[]
  application: ProfileData
}

export default function ProfileCompletionPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [completion, setCompletion] = useState<CompletionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<ProfileData>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string>("")

  useEffect(() => {
    if (status === "loading") return
    const user = session?.user as any
    if (!user) {
      router.replace("/login")
      return
    }
    fetchProfileData()
  }, [session, status, router])

  const fetchProfileData = async () => {
    try {
      const res = await fetch("/api/volunteer/profile")
      const data = await res.json()
      if (data.success) {
        setCompletion(data)
        setFormData(data.application || {})
      }
    } catch (error) {
      console.error("Error fetching profile:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (field: string, file: File) => {
    setUploading(field)
    setErrors((prev) => ({ ...prev, [field]: "" }))
    try {
      const uploadFormData = new FormData()
      uploadFormData.append("file", file)

      const res = await fetch("/api/upload/cloudinary", {
        method: "POST",
        body: uploadFormData,
      })

      const data = await res.json()
      if (data.success) {
        setFormData((prev) => ({ ...prev, [field]: data.url }))
        setErrors((prev) => ({ ...prev, [field]: "" }))
        setSuccessMessage(`${field === "photo" ? "Photo" : field === "signature" ? "Signature" : "File"} uploaded successfully!`)
        setTimeout(() => setSuccessMessage(""), 3000)
      } else {
        setErrors((prev) => ({ ...prev, [field]: "Upload failed. Please try again." }))
      }
    } catch (error) {
      setErrors((prev) => ({ ...prev, [field]: "Upload failed. Please try again." }))
    } finally {
      setUploading(null)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/volunteer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (data.success) {
        setSuccessMessage("Profile saved successfully!")
        setTimeout(() => setSuccessMessage(""), 3000)
        await fetchProfileData()
        // Redirect to projects if profile is 100% complete
        if (data.completion?.percent === 100) {
          setTimeout(() => {
            router.push("/dashboard/projects")
          }, 1500)
        }
      } else {
        setErrors({ general: data.message || "Failed to save profile" })
      }
    } catch (error) {
      console.error("Error saving profile:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    )
  }

  if (!completion) {
    return <div className="p-6">Failed to load profile data</div>
  }

  const getProgressColor = () => {
    if (completion.percent === 100) return "from-emerald-500 to-green-600"
    if (completion.percent >= 75) return "from-blue-500 to-indigo-600"
    if (completion.percent >= 50) return "from-amber-500 to-orange-500"
    return "from-orange-500 to-red-500"
  }

  const getStatusIcon = () => {
    if (completion.percent === 100) {
      return <AlertCircle className="w-6 h-6 text-amber-500" />
    }
    return <CheckCircle className="w-6 h-6 text-emerald-500" />
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* Success Message */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage("")} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-xl border border-primary/20 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Complete Your Profile</h1>
              <p className="text-muted-foreground mt-1">Fill in the missing information to proceed to project selection</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center md:text-right">
              <div className="text-4xl md:text-5xl font-bold text-primary">
                {completion.percent}%
              </div>
              <div className="text-sm text-muted-foreground font-medium">Complete</div>
            </div>
            {getStatusIcon()}
          </div>
        </div>
      </div>

      {/* Progress Card */}
      {/* <div className="bg-card rounded-xl border border-border shadow-sm p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-base font-semibold text-foreground">Profile Completion</span>
            <span className="text-2xl font-bold text-primary">
              {completion.percent}%
            </span>
          </div>
          <div className="w-full bg-muted/50 rounded-full h-4 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${getProgressColor()} transition-all duration-700 ease-out shadow-sm flex items-center justify-end pr-2`}
              style={{ width: `${completion.percent}%` }}
            >
              {completion.percent > 10 && (
                <span className="text-xs font-semibold text-white drop-shadow-sm">
                  {completion.percent}%
                </span>
              )}
            </div>
          </div>
          {completion.percent <= 10 && (
            <div className="text-right mt-1">
              <span className="text-xs font-medium text-muted-foreground">{completion.percent}% Complete</span>
            </div>
          )}
        </div>
        {Array.isArray(completion.missing) && completion.missing.length > 0 && (
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm font-semibold text-foreground mb-3 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
              Missing Information ({completion.missing.length}):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {completion.missing.map((item, index) => (
                <div key={index} className="flex items-center text-sm text-amber-800 dark:text-amber-200">
                  <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mr-2"></span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}
        {completion.percent === 100 && (
          <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Profile Complete! You can now proceed to project selection.
            </p>
          </div>
        )}
      </div> */}

      {/* Form Fields */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 md:p-8 space-y-8">
        {/* Section 1: Documents */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Documents & Certificates</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Photo */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Student Photo <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {formData.photo ? (
                  <div className="relative group">
                    <img src={formData.photo} alt="Photo" className="w-32 h-40 object-cover rounded-lg border-2 border-primary/20 shadow-sm" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ) : (
                  <div className="w-32 h-40 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
                    <Camera className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs">No Photo</span>
                  </div>
                )}
                <label className="flex-1 cursor-pointer">
                  <div className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                    {uploading === "photo" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        {formData.photo ? "Change Photo" : "Upload Photo"}
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload("photo", file)
                    }}
                    className="hidden"
                    disabled={uploading === "photo"}
                  />
                </label>
              </div>
              {errors.photo && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.photo}</p>}
            </div>

            {/* Signature */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Student Signature <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {formData.signature ? (
                  <div className="relative group">
                    <img src={formData.signature} alt="Signature" className="w-32 h-16 object-contain rounded-lg border-2 border-primary/20 shadow-sm bg-white" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ) : (
                  <div className="w-32 h-16 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-muted/30">
                    <FileText className="w-6 h-6 mb-1 opacity-50" />
                    <span className="text-xs">No Signature</span>
                  </div>
                )}
                <label className="flex-1 cursor-pointer">
                  <div className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                    {uploading === "signature" ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        {formData.signature ? "Change Signature" : "Upload Signature"}
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload("signature", file)
                    }}
                    className="hidden"
                    disabled={uploading === "signature"}
                  />
                </label>
              </div>
              {errors.signature && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.signature}</p>}
            </div>
          </div>
          
          {/* Institutional ID Card and High School Certificate */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Institutional ID Card */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">
                Institution I-Card Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.institutionalIdCard || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, institutionalIdCard: e.target.value }))}
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="Enter your institution ID card number"
              />
            </div>

            {/* High School Certificate */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-foreground">High School Certificate</label>
              {formData.highSchoolCertificate ? (
                <div className="flex items-center gap-2 mb-2">
                  <a
                    href={formData.highSchoolCertificate}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm flex items-center gap-1"
                  >
                    <FileText className="w-4 h-4" />
                    View Certificate
                  </a>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
              ) : null}
              <label className="cursor-pointer">
                <div className="px-4 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                  {uploading === "highSchoolCertificate" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      {formData.highSchoolCertificate ? "Change Certificate" : "Upload Certificate"}
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileUpload("highSchoolCertificate", file)
                  }}
                  className="hidden"
                  disabled={uploading === "highSchoolCertificate"}
                />
              </label>
              {errors.highSchoolCertificate && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {errors.highSchoolCertificate}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: My Bharat Portal */}
        <div className="pt-6 border-t border-border">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">My Bharat Portal</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={formData.myBharatPortalRegistered || false}
                onChange={(e) => setFormData((prev) => ({ ...prev, myBharatPortalRegistered: e.target.checked }))}
                className="w-5 h-5 text-primary rounded border-border focus:ring-2 focus:ring-primary/20"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-foreground">Registered on My Bharat Portal</span>
                <p className="text-xs text-muted-foreground mt-1">Check this if you have registered on the My Bharat Portal</p>
              </div>
            </label>
            {formData.myBharatPortalRegistered && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">My Bharat Portal ID</label>
                  <input
                    type="text"
                    value={formData.myBharatPortalId || ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, myBharatPortalId: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="Enter your My Bharat Portal ID"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">Portal Screenshot</label>
                  <label className="cursor-pointer">
                    <div className="px-4 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors flex items-center justify-center gap-2 text-sm font-medium">
                      {uploading === "myBharatPortalScreenshot" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          {formData.myBharatPortalScreenshot ? "Change Screenshot" : "Upload Screenshot"}
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleFileUpload("myBharatPortalScreenshot", file)
                      }}
                      className="hidden"
                      disabled={uploading === "myBharatPortalScreenshot"}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Social Media Profiles */}
        <div className="pt-6 border-t border-border">
          <div className="flex items-center gap-2 mb-6">
            <Link2 className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Social Media Profiles</h2>
            <span className="text-xs bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full font-medium">Required</span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Please provide your social media profile links. If you don't have an account, please create one as these are mandatory.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Facebook Profile URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={formData.socialFacebook || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, socialFacebook: e.target.value }))}
                  placeholder="https://www.facebook.com/your.profile"
                  className="w-full px-4 py-2.5 pl-10 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              {formData.socialFacebook && (
                <a href={formData.socialFacebook} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  Valid link
                </a>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Instagram Profile URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={formData.socialInstagram || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, socialInstagram: e.target.value }))}
                  placeholder="https://www.instagram.com/your.profile"
                  className="w-full px-4 py-2.5 pl-10 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              {formData.socialInstagram && (
                <a href={formData.socialInstagram} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  Valid link
                </a>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                Twitter/X Profile URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={formData.socialTwitter || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, socialTwitter: e.target.value }))}
                  placeholder="https://x.com/your.profile"
                  className="w-full px-4 py-2.5 pl-10 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              {formData.socialTwitter && (
                <a href={formData.socialTwitter} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  Valid link
                </a>
              )}
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                LinkedIn Profile URL <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={formData.socialLinkedin || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, socialLinkedin: e.target.value }))}
                  placeholder="https://www.linkedin.com/in/your.profile"
                  className="w-full px-4 py-2.5 pl-10 border border-border rounded-lg bg-input text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  required
                />
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              {formData.socialLinkedin && (
                <a href={formData.socialLinkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" />
                  Valid link
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-6 border-t border-border">
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {errors.general}
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {completion.percent < 100 ? "Complete all required fields to proceed to project selection" : "All required fields are complete!"}
            </p>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-lg hover:from-primary/90 hover:to-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg font-medium"
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

