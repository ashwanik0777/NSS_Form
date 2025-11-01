"use client"

import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function SetPasswordPage() {
  const sessionData = useSession()
  const data = sessionData?.data
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (sessionData.status === "loading") return
    const user = data?.user as any
    if (!user) {
      router.replace("/login")
      return
    }
    if (!user.mustChangePassword) {
      router.replace("/dashboard")
    }
  }, [data, sessionData.status, router])

  const submit = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: password }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.message || "Failed to set password")
      } else {
        router.replace("/dashboard")
      }
    } finally {
      setLoading(false)
    }
  }

  if (sessionData.status === "loading") return null

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-2">Set your password</h1>
      <p className="text-sm text-muted-foreground mb-4">Create a new password to continue</p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border rounded-md px-3 py-2 mb-3"
        placeholder="New password (min 6 chars)"
      />
      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
      <button onClick={submit} disabled={loading || password.length < 6} className="px-4 py-2 bg-primary text-white rounded-md">
        {loading ? "Saving..." : "Save password"}
      </button>
    </div>
  )
}


