"use client"

import { useEffect, useState } from "react"
import AdminHeader from "@/components/admin/AdminHeader"

export default function AdminSocialLinksPage() {
  const [form, setForm] = useState({ facebook: "", instagram: "", twitter: "", linkedin: "" })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

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
      if (data.success) setMessage("Saved")
      else setMessage(data.message || "Failed to save")
    } catch {
      setMessage("Failed to save")
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(""), 2500)
    }
  }

  return (
    <>
      <AdminHeader title="NSS Social Links" subtitle="Manage official NSS social media links" />
      <div className="p-6 max-w-3xl">
        {loading ? (
          <div className="text-muted-foreground">Loading...</div>
        ) : (
          <div className="bg-card rounded-lg border border-border p-6 space-y-4">
            {([
              { key: "facebook", label: "Facebook" },
              { key: "instagram", label: "Instagram" },
              { key: "twitter", label: "Twitter/X" },
              { key: "linkedin", label: "LinkedIn" },
            ] as const).map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-foreground mb-1">{f.label} URL</label>
                <input
                  type="url"
                  value={(form as any)[f.key]}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={`https://`}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground"
                />
              </div>
            ))}
            <div className="pt-2">
              <button onClick={save} disabled={saving} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg">
                {saving ? "Saving..." : "Save"}
              </button>
              {message && <span className="ml-3 text-sm text-muted-foreground">{message}</span>}
            </div>
          </div>
        )}
      </div>
    </>
  )
}


