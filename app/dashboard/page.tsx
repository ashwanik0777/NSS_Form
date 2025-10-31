"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function VolunteerDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return
    const user = session?.user as any
    if (!user) {
      router.replace("/login")
      return
    }
    if (user.role !== "volunteer" && user.role !== "user") {
      router.replace("/")
      return
    }
    if (user.mustChangePassword) {
      router.replace("/set-password")
      return
    }
  }, [session, status, router])

  if (status === "loading") return null

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Volunteer Dashboard</h1>
      <ProfileCompletionCard />
    </div>
  )
}

function ProfileCompletionCard() {
  const [state, setState] = React.useState<{ percent: number; missing: string[] } | null>(null)

  useEffect(() => {
    ;(async () => {
      const res = await fetch("/api/volunteer/profile")
      const data = await res.json()
      if (data.success) setState({ percent: data.completion.percent, missing: data.completion.missing })
    })()
  }, [])

  if (!state) return null
  return (
    <div className="border rounded-md p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Profile Completion</h2>
          <p className="text-sm text-muted-foreground">Complete your profile to proceed</p>
        </div>
        <div className="text-lg font-bold">{state.percent}%</div>
      </div>
      {state.missing.length > 0 && (
        <ul className="mt-3 list-disc pl-6 text-sm">
          {state.missing.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
    </div>
  )
}


