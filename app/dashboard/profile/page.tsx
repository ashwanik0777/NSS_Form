"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2, User, CheckCircle, AlertCircle, Save } from "lucide-react"

interface ProfileData {
  photo?: string
  signature?: string
  institutionalIdCard?: string
  highSchoolCertificate?: string
  myBharatPortalRegistered?: boolean
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
      }
    } catch (error) {
      setErrors((prev) => ({ ...prev, [field]: "Upload failed" }))
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
        await fetchProfileData()
        // Redirect to projects if profile is 100% complete
        if (data.completion?.percent === 100) {
          router.push("/dashboard/projects")
        }
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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <User className="w-8 h-8 mr-3 text-primary" />
            Complete Your Profile
          </h1>
          <p className="text-muted-foreground mt-2">Fill in the missing information to complete your profile</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">{completion.percent}%</div>
          <div className="text-sm text-muted-foreground">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="mb-4">
          <div className="w-full bg-muted rounded-full h-4">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${
                completion.percent === 100 ? "bg-green-500" : completion.percent >= 50 ? "bg-yellow-500" : "bg-red-500"
              }`}
              style={{ width: `${completion.percent}%` }}
            />
          </div>
        </div>
        {Array.isArray(completion.missing) && completion.missing.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-foreground mb-2 flex items-center">
              {completion.percent === 100 ? (
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-2 text-yellow-500" />
              )}
              Missing Information:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {completion.missing.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Form Fields */}
      <div className="bg-card rounded-lg border border-border p-6 space-y-6">
        {/* Photo */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Student Photo</label>
          <div className="flex items-center space-x-4">
            {formData.photo ? (
              <img src={formData.photo} alt="Photo" className="w-32 h-40 object-cover rounded-lg border" />
            ) : (
              <div className="w-32 h-40 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground">
                No Photo
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload("photo", file)
              }}
              className="text-sm"
            />
          </div>
          {errors.photo && <p className="text-red-500 text-sm mt-1">{errors.photo}</p>}
        </div>

        {/* Signature */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Student Signature</label>
          <div className="flex items-center space-x-4">
            {formData.signature ? (
              <img src={formData.signature} alt="Signature" className="w-32 h-16 object-contain rounded-lg border" />
            ) : (
              <div className="w-32 h-16 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground text-xs">
                No Signature
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload("signature", file)
              }}
              className="text-sm"
            />
          </div>
          {errors.signature && <p className="text-red-500 text-sm mt-1">{errors.signature}</p>}
        </div>

        {/* Institutional ID Card */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Institution I-Card Number</label>
          <input
            type="text"
            value={formData.institutionalIdCard || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, institutionalIdCard: e.target.value }))}
            className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground"
            placeholder="Enter your institution ID card number"
          />
        </div>

        {/* High School Certificate */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">High School Certificate</label>
          {formData.highSchoolCertificate ? (
            <div className="flex items-center space-x-4">
              <a
                href={formData.highSchoolCertificate}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                View Certificate
              </a>
            </div>
          ) : null}
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload("highSchoolCertificate", file)
            }}
            className="mt-2 text-sm"
          />
          {errors.highSchoolCertificate && <p className="text-red-500 text-sm mt-1">{errors.highSchoolCertificate}</p>}
        </div>

        {/* My Bharat Portal Registration */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">My Bharat Portal Registration</label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.myBharatPortalRegistered || false}
                onChange={(e) => setFormData((prev) => ({ ...prev, myBharatPortalRegistered: e.target.checked }))}
                className="mr-2"
              />
              <span className="text-sm text-foreground">Registered on My Bharat Portal</span>
            </label>
          </div>
        </div>

      {/* Social Profiles (Mandatory) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Facebook Profile URL</label>
          <input
            type="url"
            value={formData.socialFacebook || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, socialFacebook: e.target.value }))}
            placeholder="https://www.facebook.com/your.profile"
            className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">If you don't have one, please create and add the link. This is mandatory.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Instagram Profile URL</label>
          <input
            type="url"
            value={formData.socialInstagram || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, socialInstagram: e.target.value }))}
            placeholder="https://www.instagram.com/your.profile"
            className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">If you don't have one, please create and add the link. This is mandatory.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Twitter/X Profile URL</label>
          <input
            type="url"
            value={formData.socialTwitter || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, socialTwitter: e.target.value }))}
            placeholder="https://x.com/your.profile"
            className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">If you don't have one, please create and add the link. This is mandatory.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">LinkedIn Profile URL</label>
          <input
            type="url"
            value={formData.socialLinkedin || ""}
            onChange={(e) => setFormData((prev) => ({ ...prev, socialLinkedin: e.target.value }))}
            placeholder="https://www.linkedin.com/in/your.profile"
            className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">If you don't have one, please create and add the link. This is mandatory.</p>
        </div>
      </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin w-5 h-5 mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Save Profile
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

