"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import VolunteerSidebar from "@/components/volunteer/VolunteerSidebar"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { Loader2 } from "lucide-react"

export default function VolunteerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [checkingProfile, setCheckingProfile] = useState(true)

  useEffect(() => {
    if (status === "loading") return
    
    const user = session?.user as any
    if (!user) return
    
    // Allow access to profile page always
    if (pathname === "/dashboard/profile") {
      setCheckingProfile(false)
      return
    }
    
    // Check profile completion for other pages
    const checkProfile = async () => {
      try {
        const res = await fetch("/api/volunteer/profile")
        const data = await res.json()
        
        if (data.success && data.completion) {
          // If profile not complete, redirect to profile page
          if (data.completion.percent < 100) {
            router.push("/dashboard/profile")
            return
          }
          
          // If profile complete, check project selection
          if (data.completion.percent === 100) {
            const projectRes = await fetch("/api/volunteer/projects")
            const projectData = await projectRes.json()
            
            // If no project selected and not on projects page, redirect to projects
            if (!projectData.selectedProject && pathname !== "/dashboard/projects") {
              router.push("/dashboard/projects")
              return
            }
          }
        }
      } catch (error) {
        console.error("Error checking profile:", error)
      } finally {
        setCheckingProfile(false)
      }
    }
    
    checkProfile()
  }, [session, status, pathname, router])

  if (status === "loading" || checkingProfile) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="volunteer">
      <div className="flex h-screen bg-background overflow-hidden">
        <VolunteerSidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}

