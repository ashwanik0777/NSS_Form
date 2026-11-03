"use client"

import { useEffect, useState } from "react"
import AdminHeader from "@/components/admin/AdminHeader"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { Loader2, Save as SaveIcon, CheckCircle2, Share2, ExternalLink } from "lucide-react"

export default function AdminSocialLinksPage() {
  const [form, setForm] = useState({ facebook: "", instagram: "", twitter: "", linkedin: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/social-links")
        const data = await res.json()
        if (data.success && data.links) {
          setForm({
            facebook: data.links.facebook || "",
            instagram: data.links.instagram || "",
            twitter: data.links.twitter || "",
            linkedin: data.links.linkedin || "",
          })
        }
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    setMessage("")
    try {
      const res = await fetch("/api/admin/social-links", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setMessage("Social links updated successfully!")
        setIsSuccess(true)
      } else {
        setMessage(data.message || "Failed to save")
        setIsSuccess(false)
      }
    } catch {
      setMessage("Failed to save")
      setIsSuccess(false)
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(""), 3500)
    }
  }

  const platforms = [
    { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/nss.gbu" },
    { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/nss_gbu" },
    { key: "twitter", label: "Twitter / X", placeholder: "https://x.com/nss_gbu" },
    { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/nss-gbu" },
  ] as const

  return (
    <ProtectedRoute requiredRole="sub-admin" requiredPermission="social.view">
      <AdminHeader title="NSS Social Links" subtitle="Manage official NSS public social media channels" />
      <div className="p-3 sm:p-5 md:p-6 max-w-3xl space-y-4 sm:space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
            <p className="text-xs text-muted-foreground">Loading social links...</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-4 sm:p-6 space-y-5 shadow-xs">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-base">Public Channel Handles</h3>
                <p className="text-xs text-muted-foreground">These links appear on the public portal and volunteer dashboards</p>
              </div>
            </div>

            <div className="space-y-4">
              {platforms.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <label className="block text-xs font-semibold text-foreground uppercase tracking-wide">
                    {f.label} URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={(form as any)[f.key]}
                      onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    />
                    {(form as any)[f.key] && (
                      <a
                        href={(form as any)[f.key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary p-1"
                        title={`Open ${f.label}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3 border-t border-border">
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-xs active:scale-95 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveIcon className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>

              {message && (
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ${
                    isSuccess
                      ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : "bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                  }`}
                >
                  {isSuccess && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {message}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}



