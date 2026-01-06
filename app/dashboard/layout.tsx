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
    // Immediate logging to track lifecycle
    console.log("Layout Effect Run. Status:", status, "Session User:", session?.user);

    if (status === "loading") return
    
    // Handle unauthenticated state immediately to prevent hanging
    if (status === "unauthenticated" || !session) {
      console.log("User unauthenticated in Layout, stopping profile check.");
      setCheckingProfile(false);
      return;
    }

    const user = session?.user as any
    // Extra safety
    if (!user) {
       console.log("Authenticated but no user object, stopping check.");
       setCheckingProfile(false);
       return;
    }
    
    // Allow access to profile page always
    if (pathname === "/dashboard/profile") {
      setCheckingProfile(false)
      return
    }
    
    // Check profile completion for other pages
    const checkProfile = async () => {
      console.log("Checking profile for user:", user);
      
      // Skip check for admins/sub-admins to prevent lockout
      // Also check for user ID existence to avoid race conditions
      // MODIFIED: Do NOT skip if we are on dashboard layout. We want them to see their volunteer data.
      // But we must handle the case where they haven't applied yet.
      
      if (!user || !user.id) {
         setCheckingProfile(false)
         return
      }

      try {
        console.log("Fetching profile completion status...");
        const res = await fetch("/api/volunteer/profile")
        const data = await res.json()
        console.log("Profile data received:", data);
        
        if (data.success) { 
             if (data.completion && data.completion.percent < 100) {
                 console.log("Profile incomplete, redirecting to /dashboard/profile");
                 router.push("/dashboard/profile")
                 return
             }
             
             if (data.completion && data.completion.percent === 100) {
                 console.log("Profile complete. Checking projects...");
                 const projectRes = await fetch("/api/volunteer/projects")
                 const projectData = await projectRes.json()
                 
                 // If no project selected and not on projects page, redirect to projects
                 if (!projectData.selectedProject && pathname !== "/dashboard/projects") {
                   console.log("No project selected, redirecting to /dashboard/projects");
                   router.push("/dashboard/projects")
                   return
                 }
             }
        }
      } catch (error) {
        console.error("Error checking profile:", error)
      } finally {
        console.log("Finished checking profile, setting checkingProfile = false");
        setCheckingProfile(false)
      }
    }
    
    // Safety timeout - IF profile check hangs, force show dashboard after 5s
    const timer = setTimeout(() => {
        if (checkingProfile) {
            console.warn("Profile check timed out, forcing dashboard render.");
            setCheckingProfile(false);
        }
    }, 5000); // 5 seconds timeout

    checkProfile()
    
    return () => clearTimeout(timer);
  }, [session, status, pathname, router])

  if (status === "loading" || checkingProfile) {
    console.log("Dashboard Layout Rendering Loader. Status:", status, "CheckingProfile:", checkingProfile);
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading Dashboard...</p>
        <div className="text-xs text-muted-foreground/50">
           Status: {status} | Checking: {checkingProfile.toString()}
        </div>
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

